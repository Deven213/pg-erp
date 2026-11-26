import { Pressable } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '@/theme';
import { TextField } from './TextField';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  testID?: string;
};

export function SearchBar({ value, onChangeText, placeholder, testID }: SearchBarProps) {
  const { t } = useTranslation();
  return (
    <TextField
      testID={testID}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder ?? t('common.search')}
      leftIcon={Search}
      returnKeyType="search"
      autoCorrect={false}
      accessibilityRole="search"
      right={
        value ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => onChangeText('')} hitSlop={10}>
            <X size={16} color={colors.ink3} />
          </Pressable>
        ) : null
      }
    />
  );
}
