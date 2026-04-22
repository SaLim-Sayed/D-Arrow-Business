import { Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
// No ScrollArea import needed for HeroUI as it uses native scrollbars or custom styles

export function AppLayout() {
  return (
    <div className="flex min-h-screen overflow-auto">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto">
          <main className="p-4 md:p-6">{<Outlet />}</main>
        </div>
      </div>
    </div>
  );
}
