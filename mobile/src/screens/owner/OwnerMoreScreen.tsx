import type { ReactNode } from 'react';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { AppHeader, AppText, Badge, ListGroup, ListItem, Screen } from '@/components';
import { ownerModules } from '@/constants/modules';
import type { OwnerModuleKey, OwnerStackParamList } from '@/navigation/types';
import { LogoutAction } from '@/screens/shared/LogoutAction';
import { statusKey, statusTone } from '@/screens/shared/ModulePlaceholder';
import { colors } from '@/theme';

/** Modules that live under More in the wireframe (D-04), rather than in the bottom bar. */
const MORE_SECTIONS: { title: string; keys: OwnerModuleKey[] }[] = [
  { title: 'Operations', keys: ['complaints', 'reservations', 'staff', 'notifications'] },
  { title: 'Business', keys: ['reports', 'subscription', 'settings'] },
];

export function OwnerMoreScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<OwnerStackParamList>>();
  return (
    <Screen header={<AppHeader large title={t('nav.more')} />}>
      {MORE_SECTIONS.map((section) => (
        <ListGroupSection key={section.title} title={section.title}>
          {section.keys.map((key, i) => {
            const m = ownerModules[key];
            return (
              <ListItem
                key={key}
                icon={m.icon}
                iconTone="info"
                title={m.title}
                right={<Badge label={t(statusKey[m.apiStatus])} tone={statusTone[m.apiStatus]} />}
                onPress={() => navigation.navigate('OwnerModule', { moduleKey: key })}
                showChevron
                last={i === section.keys.length - 1}
                testID={`more-${key}`}
              />
            );
          })}
        </ListGroupSection>
      ))}
      <LogoutAction />
    </Screen>
  );
}

function ListGroupSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <AppText variant="overline" color={colors.ink3} style={{ marginTop: 4 }}>
        {title}
      </AppText>
      <ListGroup>{children}</ListGroup>
    </>
  );
}
