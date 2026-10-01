import * as TabsPrimitive from '@radix-ui/react-tabs'

export const Tabs = TabsPrimitive.Root
export const TabsList = ({ className = '', ...props }: TabsPrimitive.TabsListProps) => <TabsPrimitive.List className={`inline-flex gap-1 rounded-xl border border-gold/20 bg-ink/60 p-1 ${className}`} {...props} />
export const TabsTrigger = ({ className = '', ...props }: TabsPrimitive.TabsTriggerProps) => <TabsPrimitive.Trigger className={`rounded-lg px-3 py-2 text-sm text-muted transition data-[state=active]:bg-gold data-[state=active]:text-ink ${className}`} {...props} />
export const TabsContent = TabsPrimitive.Content
