import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { Colors, BorderRadius, FontSize, FontWeight } from '../../constants/theme';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
}

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

const fontSizeMap = {
  xs: FontSize.xs,
  sm: FontSize.sm,
  md: FontSize.md,
  lg: FontSize.xl,
  xl: FontSize.xxxl,
};

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 'md',
  style,
}) => {
  const dimension = sizeMap[size];
  const fontSize = fontSizeMap[size];

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const containerStyles = [
    styles.container,
    {
      width: dimension,
      height: dimension,
      borderRadius: dimension / 2,
    },
    style,
  ];

  if (uri) {
    const imageStyle: ImageStyle = {
      width: dimension,
      height: dimension,
      borderRadius: dimension / 2,
      overflow: 'hidden',
    };

    return (
      <Image
        source={{ uri }}
        style={imageStyle}
        resizeMode="cover"
      />
    );
  }

  return (
    <View style={[containerStyles, styles.placeholder]}>
      <Text style={[styles.initials, { fontSize }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.textInverse,
    fontWeight: FontWeight.semibold,
  },
});
