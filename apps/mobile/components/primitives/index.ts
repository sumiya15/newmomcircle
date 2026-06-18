// Barrel export — import all primitives from one place
export { default as Screen }        from './Screen';
export { default as Card }          from './Card';
export { default as Avatar }        from './Avatar';
export { default as Badge }         from './Badge';
export { default as Input }         from './Input';
export { default as Tag }           from './Tag';
export { default as SectionHeader } from './SectionHeader';
export { default as SkeletonBlock } from './SkeletonBlock';

// Re-export existing common components so consumers import from one barrel
export { default as Button }      from '../common/Button';
export { default as EmptyState }  from '../common/EmptyState';
export { default as ScreenHeader } from '../common/ScreenHeader';
