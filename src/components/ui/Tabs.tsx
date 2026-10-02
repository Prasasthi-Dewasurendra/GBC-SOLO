import * as TabsPrimitive from '@radix-ui/react-tabs'

export const Tabs = TabsPrimitive.Root
export const TabsList = ({ className = '', ...props }: TabsPrimitive.TabsListProps) => (
  <TabsPrimitive.List
    className={`inline-flex gap-1 rounded-lg border border-white/10 bg-[#0A0A0A] p-1 ${className}`}
    {...props}
  />
)
export const TabsTrigger = ({ className = '', ...props }: TabsPrimitive.TabsTriggerProps) => (
  <TabsPrimitive.Trigger
    className={`rounded-md px-3 py-1.5 text-xs font-medium text-[#A3A3A3] transition data-[state=active]:bg-white/15 data-[state=active]:text-[#F5F5F5] ${className}`}
    {...props}
  />
)
export const TabsContent = TabsPrimitive.Content
