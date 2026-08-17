import React from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { colors } from '@/theme';

interface OracleAvatarProps {
  imageSource: ImageSourcePropType;
  size?: number;
  online?: boolean;
}

/** Small circular character portrait, used in the reading header. */
export function OracleAvatar({ imageSource, size = 44, online }: OracleAvatarProps) {
  return (
    <View style={{ width: size, height: size }}>
      <Image
        source={imageSource}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
        resizeMode="cover"
      />
      {online ? (
        <View
          style={[
            styles.dot,
            {
              width: size * 0.26,
              height: size * 0.26,
              borderRadius: size * 0.13,
              right: -1,
              bottom: -1,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
  },
  dot: {
    position: 'absolute',
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.background,
  },
});
