export interface ProjectTerminalTab {
  id: string;
  projectId?: string | null;
}

export function getTabIdForProjectFocus(
  tabs: ProjectTerminalTab[],
  activeTabId: string,
  projectId: string | null | undefined,
) {
  if (!projectId) return null;

  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  if (activeTab?.projectId === projectId) return activeTab.id;

  return tabs.find((tab) => tab.projectId === projectId)?.id ?? null;
}
