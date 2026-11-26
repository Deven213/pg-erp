import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Controller, useForm, type Control, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { ApiError } from '@/api/errors';
import { AppHeader, AppText, Button, ChipGroup, ConfirmDialog, ErrorState, FormSection, LoadingState, Screen, TextField, type TextFieldProps } from '@/components';
import type { Property } from '@/features/properties/propertyContract';
import {
  emptyPropertyForm,
  formValuesFrom,
  PROPERTY_TYPE_SUGGESTIONS,
  propertyFormSchema,
  toPropertyUpsert,
  type PropertyFormOutput,
  type PropertyFormValues,
} from '@/features/properties/propertyForm';
import { useOwnerTenantId, usePropertiesQuery, usePropertyQuery, useSaveProperty } from '@/features/properties/queries';
import type { OwnerStackParamList } from '@/navigation/types';
import { useToast } from '@/providers/ToastProvider';
import { colors, spacing, tones } from '@/theme';

/** Add property (no propertyId) or Edit property (with propertyId). */
export function PropertyFormScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { propertyId } = useRoute<RouteProp<OwnerStackParamList, 'PropertyForm'>>().params ?? {};
  const title = propertyId ? t('properties.editTitle') : t('properties.addTitle');
  if (!propertyId) return <PropertyForm title={title} onDone={() => navigation.goBack()} />;
  return <EditLoader propertyId={propertyId} title={title} onDone={() => navigation.goBack()} />;
}

function EditLoader({ propertyId, title, onDone }: { propertyId: string; title: string; onDone: () => void }) {
  const navigation = useNavigation();
  const query = usePropertyQuery(propertyId);
  const header = <AppHeader title={title} onBack={() => navigation.goBack()} backIcon="close" />;
  // Edit only from the server's copy, not the list placeholder, so no field is overwritten with stale data.
  if (query.isPending || query.isPlaceholderData) {
    return (
      <Screen edges={['top', 'bottom']} header={header}>
        <LoadingState rows={6} />
      </Screen>
    );
  }
  if (query.isError) {
    return (
      <Screen edges={['top', 'bottom']} header={header}>
        <ErrorState error={query.error} onRetry={() => void query.refetch()} retrying={query.isRefetching} />
      </Screen>
    );
  }
  return <PropertyForm title={title} existing={query.data} onDone={onDone} />;
}

const ORDER = ['name', 'code', 'type', 'address', 'city', 'pincode', 'state', 'description'] as const;
type FieldName = (typeof ORDER)[number];

function PropertyForm({ title, existing, onDone }: { title: string; existing?: Property; onDone: () => void }) {
  const { t } = useTranslation();
  const toast = useToast();
  const navigation = useNavigation();
  const list = usePropertiesQuery();
  const tenantId = useOwnerTenantId(list.data);
  const save = useSaveProperty();
  const [discardAction, setDiscardAction] = useState<null | (() => void)>(null);
  const saved = useRef(false);

  const { control, handleSubmit, formState, setValue, setFocus } = useForm<PropertyFormValues, unknown, PropertyFormOutput>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: existing ? formValuesFrom(existing) : emptyPropertyForm,
    mode: 'onTouched',
  });
  const dirty = formState.isDirty;

  // Ask before throwing away typed changes (back button, swipe, hardware back).
  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        if (!dirty || saved.current) return;
        e.preventDefault();
        setDiscardAction(() => () => navigation.dispatch(e.data.action));
      }),
    [navigation, dirty],
  );

  const blockedByTenant = !existing && !tenantId && !list.isPending;
  const onValid = (values: PropertyFormOutput) => {
    if (save.isPending) return;
    const tenant = existing?.tenantId ?? tenantId;
    if (!tenant) return;
    save.mutate(toPropertyUpsert(values, { tenantId: tenant, existing }), {
      onSuccess: () => {
        saved.current = true;
        toast.show(existing ? t('properties.updated', { name: values.name }) : t('properties.created', { name: values.name }));
        onDone();
      },
    });
  };
  // handleSubmit runs from the press handler (not during render) so the `saved` ref is only read in events.
  // On invalid input, focus the first field with an error.
  const submit = () => handleSubmit(onValid, (errors) => {
    const first = ORDER.find((f) => errors[f]);
    if (first) setFocus(first);
  })();

  const saveError = save.error ? ApiError.from(save.error) : null;
  // The keyboard's Next key moves to the following field.
  const fieldProps = (name: FieldName) => ({ control, name, onNext: () => setFocus(ORDER[ORDER.indexOf(name) + 1] ?? name) });

  return (
    <Screen
      testID="property-form-screen"
      edges={['top', 'bottom']}
      header={<AppHeader title={title} subtitle={existing?.name} onBack={() => navigation.goBack()} backIcon="close" />}
      footer={
        <>
          <Button label={t('common.cancel')} variant="secondary" onPress={() => navigation.goBack()} style={styles.cancel} />
          <Button
            label={existing ? t('properties.saveChanges') : t('properties.addButton')}
            onPress={() => void submit()}
            loading={save.isPending}
            disabled={blockedByTenant || (!existing && list.isPending)}
            style={styles.flex}
            testID="property-submit"
          />
        </>
      }
    >
      {blockedByTenant ? <Banner tone="warning" text={t('properties.noTenant')} testID="no-tenant-banner" /> : null}
      {saveError ? <Banner tone="danger" text={saveError.displayMessage(t)} testID="save-error" /> : null}
      {formState.submitCount > 0 && Object.keys(formState.errors).length > 0 ? <Banner tone="danger" text={t('validation.fixFields')} /> : null}

      <FormSection title={t('properties.sectionBasics')}>
        <Field {...fieldProps('name')} label={t('properties.fields.name')} required maxLength={200} placeholder={t('properties.placeholders.name')} autoCapitalize="words" />
        <Field
          {...fieldProps('code')}
          label={t('properties.fields.code')}
          required
          maxLength={50}
          autoCapitalize="characters"
          helperText={t('properties.hints.code')}
          placeholder={t('properties.placeholders.code')}
        />
        <View style={styles.group}>
          <Field {...fieldProps('type')} label={t('properties.fields.type')} required maxLength={50} placeholder={t('properties.placeholders.type')} />
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <ChipGroup
                accessibilityLabel={t('properties.fields.type')}
                options={PROPERTY_TYPE_SUGGESTIONS.map((s) => ({ value: s, label: s }))}
                value={field.value}
                onChange={(v) => setValue('type', v, { shouldDirty: true, shouldValidate: true, shouldTouch: true })}
              />
            )}
          />
        </View>
      </FormSection>

      <FormSection title={t('properties.sectionLocation')}>
        <Field {...fieldProps('address')} label={t('properties.fields.address')} required multiline placeholder={t('properties.placeholders.address')} />
        <View style={styles.row}>
          <View style={styles.flex}>
            <Field {...fieldProps('city')} label={t('properties.fields.city')} required maxLength={100} autoCapitalize="words" />
          </View>
          <View style={styles.pin}>
            <Field {...fieldProps('pincode')} label={t('properties.fields.pincode')} required maxLength={6} keyboardType="number-pad" />
          </View>
        </View>
        <Field {...fieldProps('state')} label={t('properties.fields.state')} required maxLength={100} autoCapitalize="words" />
      </FormSection>

      <FormSection title={t('properties.sectionMore')} description={t('properties.laterHint')}>
        <Field {...fieldProps('description')} label={t('properties.fields.description')} multiline placeholder={t('properties.placeholders.description')} />
      </FormSection>

      <ConfirmDialog
        visible={discardAction !== null}
        destructive
        title={t('properties.discardTitle')}
        message={t('properties.discardMessage')}
        confirmLabel={t('properties.discard')}
        cancelLabel={t('properties.keepEditing')}
        onConfirm={() => {
          const action = discardAction;
          setDiscardAction(null);
          saved.current = true;
          action?.();
        }}
        onCancel={() => setDiscardAction(null)}
      />
    </Screen>
  );
}

type FieldProps = Omit<TextFieldProps, 'value' | 'onChangeText' | 'onBlur' | 'error'> & {
  control: Control<PropertyFormValues, unknown, PropertyFormOutput>;
  name: FieldPath<PropertyFormValues>;
  onNext: () => void;
};

function Field({ control, name, onNext, multiline, ...rest }: FieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...rest}
          multiline={multiline}
          ref={field.ref}
          testID={`field-${name}`}
          value={field.value}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
          returnKeyType={multiline ? 'default' : 'next'}
          submitBehavior={multiline ? undefined : 'submit'}
          onSubmitEditing={multiline ? undefined : onNext}
        />
      )}
    />
  );
}

function Banner({ tone, text, testID }: { tone: 'warning' | 'danger'; text: string; testID?: string }) {
  const c = tones[tone];
  return (
    <View style={[styles.banner, { backgroundColor: c.bg }]} accessibilityRole="alert" testID={testID}>
      <CircleAlert size={18} color={c.fg} />
      <AppText variant="bodySmall" color={c.fg} style={styles.flex}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
  cancel: { flex: 0.6 },
  pin: { width: 120 },
  banner: { flexDirection: 'row', gap: spacing.sm, borderRadius: 12, padding: spacing.md, alignItems: 'flex-start', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.stroke },
});
