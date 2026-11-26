import { Text, type TextProps, type TextStyle } from 'react-native';

import { colors, fontFamily, typeScale, type FontWeightName, type TypeVariant } from '@/theme';

export type AppTextProps = TextProps & {
  variant?: TypeVariant;
  color?: string;
  weight?: FontWeightName;
  align?: TextStyle['textAlign'];
  /** Tabular figures for money and counts that line up in columns. */
  numeric?: boolean;
};

export function AppText({
  variant = 'body',
  color = colors.ink,
  weight,
  align,
  numeric,
  style,
  ...rest
}: AppTextProps) {
  return (
    <Text
      {...rest}
      style={[
        typeScale[variant],
        { color },
        weight ? { fontFamily: fontFamily[weight] } : null,
        align ? { textAlign: align } : null,
        numeric ? { fontVariant: ['tabular-nums'] } : null,
        style,
      ]}
    />
  );
}
