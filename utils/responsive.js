export const BREAKPOINTS = {
  mobile: 0,
  tablet: 481,
  desktop: 769,
  wide: 1025,
};

export function getScreenType(width) {
  if (width < BREAKPOINTS.tablet) return 'mobile';
  if (width < BREAKPOINTS.desktop) return 'tablet';
  if (width < BREAKPOINTS.wide) return 'desktop';
  return 'wide';
}

export function getContentWidth(screenType) {
  if (screenType === 'wide') return 1280;
  if (screenType === 'desktop') return 1040;
  if (screenType === 'tablet') return 760;
  return '100%';
}
