// UI Component Library Exports
// Following SOLID principles - Single Responsibility for each component
// Design system components with consistent styling

export { default as Button } from './Button';
export { default as IconButton } from './IconButton';
export { default as Card } from './Card';
export { default as Input } from './Input';
export { default as Badge } from './Badge';
export { default as Modal } from './Modal';
export { default as Avatar } from './Avatar';

// Layout components
export { 
  PageLayout, 
  SectionLayout, 
  ContentLayout, 
  GridLayout, 
  FlexLayout, 
  StackLayout 
} from './Layout';

// Component variants for common use cases (DRY principle)
export const PrimaryButton = (props) => <Button variant="primary" {...props} />;
export const SecondaryButton = (props) => <Button variant="secondary" {...props} />;
export const AccentButton = (props) => <Button variant="accent" {...props} />;
export const HighlightButton = (props) => <Button variant="highlight" {...props} />;

export const ElevatedCard = (props) => <Card variant="elevated" {...props} />;
export const SuccessCard = (props) => <Card variant="success" {...props} />;
export const ErrorCard = (props) => <Card variant="error" {...props} />;

export const SuccessBadge = (props) => <Badge variant="success" {...props} />;
export const WarningBadge = (props) => <Badge variant="warning" {...props} />;
export const ErrorBadge = (props) => <Badge variant="error" {...props} />;
export const InfoBadge = (props) => <Badge variant="info" {...props} />;
