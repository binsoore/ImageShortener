import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Image as ImageType } from "@shared/schema";
import { Copy, Upload, Link, Rocket, Shield, Share2, Images } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface UploadResponse {
  images: ImageType[];
}

interface ImagesResponse {
  images: ImageType[];
}

export default function Home() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  // Fetch all images
  const { data: imagesData, isLoading } = useQuery<ImagesResponse>({
    queryKey: ["/api/images"],
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]): Promise<UploadResponse> => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });

      // Simulate upload progress
      setUploadProgress(0);
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Upload failed');
      }

      setTimeout(() => setUploadProgress(0), 1000);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
      toast({
        title: "업로드 완료!",
        description: "이미지가 성공적으로 업로드되었습니다.",
      });
    },
    onError: (error: Error) => {
      setUploadProgress(0);
      toast({
        title: "업로드 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      uploadMutation.mutate(acceptedFiles);
    }
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  });

  const copyToClipboard = async (shortId: string) => {
    try {
      const baseUrl = window.location.origin;
      const shortUrl = `${baseUrl}/i/${shortId}`;
      await navigator.clipboard.writeText(shortUrl);
      toast({
        title: "URL이 복사되었습니다!",
        description: "클립보드에 저장되었습니다",
      });
    } catch (error) {
      toast({
        title: "복사 실패",
        description: "URL 복사에 실패했습니다",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const images = imagesData?.images || [];
  const totalUploads = images.length;
  const activeLinks = images.length;
  
  // Get display limit from localStorage, default to 5
  const getDisplayLimit = () => {
    const saved = localStorage.getItem('imageDisplayLimit');
    return saved ? parseInt(saved, 10) : 5;
  };
  
  const displayLimit = getDisplayLimit();
  const recentImages = images
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    .slice(0, displayLimit);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">이미지 업로드</h2>
              <p className="text-sm text-slate-600">드래그 앤 드롭으로 이미지를 업로드하세요</p>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalUploads.toLocaleString()}</div>
                <div className="text-xs text-slate-500">총 업로드</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{activeLinks.toLocaleString()}</div>
                <div className="text-xs text-slate-500">활성 링크</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Upload Section */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">이미지를 업로드하세요</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              JPG, PNG, GIF, WebP 형식을 지원하며, 최대 10MB까지 업로드 가능합니다.
            </p>
          </div>

          {/* Upload Zone */}
          <div
            {...getRootProps()}
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer group ${
              isDragActive
                ? "border-blue-400 bg-blue-50"
                : "border-slate-300 hover:border-blue-400 hover:bg-blue-50/50"
            }`}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto group-hover:bg-blue-200 transition-colors">
                <Upload className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">
                  파일을 드래그하거나 클릭하여 업로드
                </h3>
                <p className="text-slate-500">
                  또는 <span className="text-blue-600 font-medium">찾아보기</span>를 클릭하세요
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 text-xs text-slate-400">
                <span className="bg-slate-100 px-2 py-1 rounded">JPG</span>
                <span className="bg-slate-100 px-2 py-1 rounded">PNG</span>
                <span className="bg-slate-100 px-2 py-1 rounded">GIF</span>
                <span className="bg-slate-100 px-2 py-1 rounded">WebP</span>
                <span className="bg-slate-100 px-2 py-1 rounded">최대 10MB</span>
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {uploadMutation.isPending && uploadProgress > 0 && (
            <div className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-700">업로드 중...</span>
                    <span className="text-sm text-slate-500">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </CardContent>
              </Card>
            </div>
          )}
        </section>

        {/* Image Gallery */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">업로드된 이미지</h2>
            <div className="text-sm text-slate-500">{images.length}개 이미지</div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      <div className="w-32 h-32 bg-slate-200 rounded-lg" />
                      <div className="flex-grow space-y-4">
                        <div className="h-4 bg-slate-200 rounded w-1/3" />
                        <div className="space-y-2">
                          <div className="h-3 bg-slate-200 rounded w-1/4" />
                          <div className="h-8 bg-slate-200 rounded" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : images.length > 0 ? (
            <div className="space-y-4">
              {recentImages.length < images.length && (
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-blue-700 text-sm">
                    최근 {displayLimit}개의 이미지만 표시 중 (전체 {images.length}개)
                  </p>
                  <p className="text-blue-600 text-xs mt-1">
                    설정에서 표시 개수를 변경할 수 있습니다
                  </p>
                </div>
              )}
              {recentImages.map((image) => (
                <Card key={image.id} className="overflow-hidden animate-in slide-in-from-bottom-4">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                      {/* Image Preview */}
                      <div className="flex-shrink-0">
                        <img
                          src={`/i/${image.shortId}`}
                          alt={image.originalName}
                          className="w-full lg:w-32 h-32 object-cover rounded-lg border border-slate-200"
                        />
                      </div>

                      {/* Image Details */}
                      <div className="flex-grow space-y-4">
                        <div>
                          <h3 className="font-semibold text-slate-900">{image.originalName}</h3>
                          <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-1">
                            <span>{formatFileSize(image.size)}</span>
                            {image.width && image.height && (
                              <span>{image.width}×{image.height}</span>
                            )}
                            <span>{formatDistanceToNow(new Date(image.uploadedAt))} 전</span>
                          </div>
                        </div>

                        {/* Short URL Display */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">단축 URL</label>
                          <div className="flex gap-2">
                            <div className="flex-grow bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
                              <code className="text-blue-600 font-mono text-sm">
                                {window.location.origin}/i/{image.shortId}
                              </code>
                            </div>
                            <Button
                              onClick={() => copyToClipboard(image.shortId)}
                              className="flex-shrink-0 bg-blue-600 hover:bg-blue-700"
                            >
                              <Copy size={16} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Images className="text-slate-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-slate-600 mb-2">
                아직 업로드된 이미지가 없습니다
              </h3>
              <p className="text-slate-500">첫 번째 이미지를 업로드해보세요!</p>
            </div>
          )}
        </section>

        {/* Feature Highlights */}
        <section className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Rocket className="text-blue-600" size={20} />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">빠른 업로드</h3>
            <p className="text-slate-600 text-sm">드래그 앤 드롭으로 간편하게 이미지를 업로드하세요</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="text-emerald-600" size={20} />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">안전한 저장</h3>
            <p className="text-slate-600 text-sm">이미지는 안전하게 암호화되어 저장됩니다</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Share2 className="text-violet-600" size={20} />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">쉬운 공유</h3>
            <p className="text-slate-600 text-sm">짧은 URL로 어디서든 쉽게 이미지를 공유하세요</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-500 rounded-lg flex items-center justify-center">
                <Link className="text-white" size={16} />
              </div>
              <span className="font-semibold text-slate-700">ImageLink</span>
            </div>
            <div className="flex space-x-6 text-sm text-slate-500">
              <a href="#" className="hover:text-slate-700 transition-colors">개인정보처리방침</a>
              <a href="#" className="hover:text-slate-700 transition-colors">이용약관</a>
              <a href="#" className="hover:text-slate-700 transition-colors">문의하기</a>
            </div>
          </div>
          <div className="border-t border-slate-200 mt-6 pt-6 text-center text-sm text-slate-400">
            © 2024 ImageLink. 모든 권리 보유.
          </div>
        </div>
      </footer>
    </div>
  );
}
