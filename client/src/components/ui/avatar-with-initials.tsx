import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AvatarWithInitialsProps extends React.ComponentPropsWithoutRef<typeof Avatar> {
  name: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export default function AvatarWithInitials({ name, className, ...props }: AvatarWithInitialsProps) {
  const initials = getInitials(name);

  return (
    <Avatar className={cn("flex items-center justify-center", className)} {...props}>
      <AvatarFallback className="font-medium">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
