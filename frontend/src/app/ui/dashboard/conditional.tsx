import { ReactNode } from "react";

// Conditional item to display something only when passed in value is true
export const Conditional = ({
  showWhen,
  children,
}: {
  showWhen: boolean;
  children: ReactNode
}) => {
  if(showWhen) {
    return <>{children}</>;
  }
  return <></>;
};