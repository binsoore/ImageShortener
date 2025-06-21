import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Image as ImageType } from "@shared/schema";
import { 
  Trash2, 
  Clock, 
  Settings as SettingsIcon, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Images,
  LogIn
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ImagesResponse {
  images: ImageType[];
}

export default function Settings() {
  const [expirationDays, setExpirationDays] = useState("5");
  const [displayLimit, setDisplayLimit] = useState(() => {
    const saved = localStorage.getItem('imageDisplayLimit');
    return saved || "5";
  });
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (!password.trim()) return;
    
    setIsLoggingIn(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      
      if (response.ok) {
        window.location.reload();
      } else {
        const error = await response.json();
        toast({
          title: "로그인 실패",
          description: error.message || "잘못된 비밀번호입니다",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "로그인 오류",
        description: "서버 연결에 실패했습니다",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Fetch images
  const { data: imagesData, isLoading: imagesLoading } = useQuery<ImagesResponse>({
    queryKey: ["/api/images"],
    enabled: isAuthenticated,
  });

  // Delete image mutation
  const deleteMutation = useMutation({
    mutationFn: async (imageId: number) => {
      const response = await apiRequest(`/api/images/${imageId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to delete image');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
      toast({
        title: "삭제 완료",
        description: "이미지가 삭제되었습니다",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "인증 만료",
          description: "다시 로그인해주세요",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Set expiration mutation
  const setExpirationMutation = useMutation({
    mutationFn: async (days: number) => {
      const results = [];
      const images = imagesData?.images || [];
      
      for (const image of images) {
        try {
          const response = await fetch(`/api/images/${image.id}/expiration`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ days }),
          });
          
          if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Failed to set expiration');
          }
          
          const result = await response.json();
          results.push(result);
        } catch (error) {
          console.error(`Error setting expiration for image ${image.id}:`, error);
        }
      }
      
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
      setExpirationDays("5");
      toast({
        title: "만료 설정 완료",
        description: "이미지들에 만료일이 설정되었습니다",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "설정 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cleanup expired images
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/cleanup-expired", {
        method: "POST",
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to cleanup');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
      toast({
        title: "삭제 완료",
        description: "이미지가 삭제되었습니다",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "인증 만료",
          description: "다시 로그인해주세요",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSetExpiration = () => {
    if (!expirationDays || expirationDays.trim() === "") {
      toast({
        title: "입력 오류",
        description: "삭제할 일수를 입력해주세요",
        variant: "destructive",
      });
      return;
    }
    
    const days = parseInt(expirationDays);
    if (isNaN(days) || days < 1 || days > 365) {
      toast({
        title: "잘못된 입력",
        description: "1일에서 365일 사이의 숫자를 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    setExpirationMutation.mutate(days);
  };

  const handleSaveDisplayLimit = () => {
    const limit = parseInt(displayLimit);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      toast({
        title: "잘못된 입력",
        description: "1개에서 100개 사이의 숫자를 입력해주세요",
        variant: "destructive",
      });
      return;
    }
    
    localStorage.setItem('imageDisplayLimit', limit.toString());
    toast({
      title: "설정 저장 완료",
      description: `홈페이지에 최근 ${limit}개 이미지가 표시됩니다`,
    });
  };

  // Password dialog for authentication
  if (!isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn size={20} />
              관리자 인증
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="관리자 비밀번호를 입력하세요"
                disabled={isLoggingIn}
              />
            </div>
            <Button 
              onClick={handleLogin} 
              className="w-full"
              disabled={isLoggingIn || !password.trim()}
            >
              {isLoggingIn ? "로그인 중..." : "로그인"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getExpirationStatus = (image: ImageType) => {
    if (!image.expiresAt) return null;
    
    const expiresAt = new Date(image.expiresAt);
    const now = new Date();
    
    if (expiresAt <= now) {
      return { status: "expired", text: "만료됨", color: "red" };
    } else {
      const timeLeft = formatDistanceToNow(expiresAt);
      return { status: "active", text: `${timeLeft} 후 만료`, color: "orange" };
    }
  };

  const images = imagesData?.images || [];
  const expiredImages = images.filter(img => 
    img.expiresAt && new Date(img.expiresAt) <= new Date()
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                <SettingsIcon size={32} />
                설정
              </h1>
              <p className="text-slate-600">이미지 자동 삭제 및 관리 설정</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-slate-600">로그인됨</p>
                <p className="font-medium text-slate-900">관리자</p>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                로그아웃
              </Button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Display Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Images size={20} />
                표시 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="display-limit">홈페이지에 표시할 이미지 개수 (1-100개)</Label>
                <Input
                  id="display-limit"
                  type="number"
                  min="1"
                  max="100"
                  value={displayLimit}
                  onChange={(e) => setDisplayLimit(e.target.value)}
                  placeholder="기본값: 5개"
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">
                  홈페이지에서 보여줄 최근 이미지의 개수를 설정합니다
                </p>
              </div>

              <Button
                onClick={handleSaveDisplayLimit}
                className="w-full"
                variant="outline"
              >
                <Images size={16} className="mr-2" />
                표시 설정 저장
              </Button>
            </CardContent>
          </Card>

          {/* Auto Delete Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock size={20} />
                이미지 만료일 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="expiration-days">삭제할 일수 (1-365일)</Label>
                <Input
                  id="expiration-days"
                  type="number"
                  min="1"
                  max="365"
                  value={expirationDays}
                  onChange={(e) => setExpirationDays(e.target.value)}
                  placeholder="기본값: 5일"
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">
                  설정한 일수가 지나면 해당 이미지들이 자동으로 삭제됩니다
                </p>
              </div>

              <div>
                <Label>현재 업로드된 이미지</Label>
                <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                  {imagesLoading ? (
                    <div className="text-sm text-slate-500">로딩 중...</div>
                  ) : images.length > 0 ? (
                    <div className="text-sm text-slate-600">
                      총 <span className="font-medium text-blue-600">{images.length}개</span>의 이미지에 만료일이 설정됩니다
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">업로드된 이미지가 없습니다</div>
                  )}
                </div>
              </div>

              <Button
                onClick={handleSetExpiration}
                disabled={setExpirationMutation.isPending || !expirationDays || images.length === 0}
                className="w-full"
              >
                <Calendar size={16} className="mr-2" />
                {setExpirationMutation.isPending ? "설정 중..." : "모든 이미지에 만료일 설정"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Expired Images */}
        {expiredImages.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-500" />
                만료된 이미지 ({expiredImages.length}개)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={20} className="text-red-500" />
                  <div>
                    <p className="font-medium text-red-900">만료된 이미지가 있습니다</p>
                    <p className="text-sm text-red-700">{expiredImages.length}개의 이미지가 만료되어 삭제 대기 중입니다</p>
                  </div>
                </div>
                <Button 
                  onClick={() => cleanupMutation.mutate()}
                  disabled={cleanupMutation.isPending}
                  variant="destructive"
                >
                  <Trash2 size={16} className="mr-2" />
                  {cleanupMutation.isPending ? "삭제 중..." : "지금 삭제"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Image List */}
        {images.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Images size={20} />
                업로드된 이미지 목록 ({images.length}개)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {images.map((image) => {
                  const status = getExpirationStatus(image);
                  return (
                    <div key={image.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <img 
                          src={`/i/${image.shortId}`}
                          alt="이미지"
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium text-sm truncate max-w-48">{image.filename}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>{Math.round(image.size / 1024)}KB</span>
                            <span>•</span>
                            <span>{image.width}×{image.height}</span>
                            {status && (
                              <>
                                <span>•</span>
                                <Badge variant={status.status === "expired" ? "destructive" : "secondary"}>
                                  {status.text}
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => deleteMutation.mutate(image.id)}
                        disabled={deleteMutation.isPending}
                        variant="outline"
                        size="sm"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}