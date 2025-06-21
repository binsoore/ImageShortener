import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import Home from "@/pages/home";
import ApiTest from "@/pages/api-test";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import { Home as HomeIcon, Code, Link as LinkIcon, Settings as SettingsIcon, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

function Navigation() {
  const [location] = useLocation();
  const { isAuthenticated, user } = useAuth();
  
  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center">
              <LinkIcon className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">ImageLink</h1>
              <p className="text-xs text-slate-600">이미지 URL 단축 서비스</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/">
              <Button variant={location === "/" ? "default" : "ghost"} size="sm">
                <HomeIcon size={16} className="mr-2" />
                홈
              </Button>
            </Link>
            <Link href="/api-test">
              <Button variant={location === "/api-test" ? "default" : "ghost"} size="sm">
                <Code size={16} className="mr-2" />
                API 테스트
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant={location === "/settings" ? "default" : "ghost"} size="sm">
                <SettingsIcon size={16} className="mr-2" />
                설정
              </Button>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-slate-600">관리자</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <div>
      <Navigation />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/api-test" component={ApiTest} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
