// The animation engine itself, split out so it can be loaded after the page
// is interactive (see MotionProvider). Only the mobile menu and the viewer
// animate with Motion, and neither is on screen at first paint.
export { domAnimation as default } from 'motion/react';
