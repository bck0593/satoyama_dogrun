import BottomTabBar from "@/src/components/bottom-tab-bar";

export function MobilePage({
  children,
  withTabs = true,
}: {
  children: React.ReactNode;
  withTabs?: boolean;
}) {
  return (
    <div className={`min-h-screen bg-[#eef3f9] ${withTabs ? "pb-24" : ""}`}>
      {children}
      {withTabs ? <BottomTabBar /> : null}
    </div>
  );
}
