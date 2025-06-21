import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Copy, Upload, FileText, Image } from "lucide-react";

export default function ApiTest() {
  const [base64Data, setBase64Data] = useState("");
  const [filename, setFilename] = useState("test.jpg");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Convert file to base64
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFilename(file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setBase64Data(e.target?.result as string || "");
    };
    reader.readAsDataURL(file);
  };

  // Test base64 upload API
  const testBase64Upload = async () => {
    if (!base64Data) {
      toast({
        title: "오류",
        description: "이미지를 선택해주세요",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/upload-base64', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: [{
            data: base64Data,
            filename: filename,
            mimeType: base64Data.split(';')[0].split(':')[1] || 'image/jpeg'
          }]
        })
      });

      const result = await response.json();
      setResponse(JSON.stringify(result, null, 2));
      
      if (response.ok) {
        toast({
          title: "업로드 성공!",
          description: "Base64 API를 통해 이미지가 업로드되었습니다",
        });
      } else {
        toast({
          title: "업로드 실패",
          description: result.message || "알 수 없는 오류가 발생했습니다",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "네트워크 오류",
        description: "요청 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Test form data upload API
  const testFormDataUpload = async () => {
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    
    if (!file) {
      toast({
        title: "오류",
        description: "파일을 선택해주세요",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('images', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      setResponse(JSON.stringify(result, null, 2));
      
      if (response.ok) {
        toast({
          title: "업로드 성공!",
          description: "Form Data API를 통해 이미지가 업로드되었습니다",
        });
      } else {
        toast({
          title: "업로드 실패",
          description: result.message || "알 수 없는 오류가 발생했습니다",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "네트워크 오류",
        description: "요청 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyResponse = () => {
    navigator.clipboard.writeText(response);
    toast({
      title: "복사 완료",
      description: "응답이 클립보드에 복사되었습니다",
    });
  };

  const copyApiExample = (type: 'base64' | 'formdata') => {
    const examples = {
      base64: `curl -X POST -H "Content-Type: application/json" \\
  -d '{
    "images": [{
      "data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
      "filename": "test.jpg",
      "mimeType": "image/jpeg"
    }]
  }' \\
  http://localhost:5000/api/upload-base64`,
      formdata: `curl -X POST \\
  -F "images=@image.jpg" \\
  http://localhost:5000/api/upload`
    };

    navigator.clipboard.writeText(examples[type]);
    toast({
      title: "예제 복사 완료",
      description: "API 예제가 클립보드에 복사되었습니다",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">API 테스트</h1>
          <p className="text-slate-600">이미지 업로드 API를 테스트해보세요</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Base64 Upload Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={20} />
                Base64 업로드 API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file-select">이미지 선택</Label>
                <Input
                  id="file-select"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="filename">파일명</Label>
                <Input
                  id="filename"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={testBase64Upload}
                  disabled={isLoading || !base64Data}
                  className="flex-1"
                >
                  <Upload size={16} className="mr-2" />
                  Base64 업로드
                </Button>
                <Button
                  variant="outline"
                  onClick={() => copyApiExample('base64')}
                >
                  <Copy size={16} />
                </Button>
              </div>

              <div className="text-xs text-slate-500 space-y-1">
                <div>POST /api/upload-base64</div>
                <div className="text-green-600">✓ 응답에 shortUrl 포함</div>
              </div>
            </CardContent>
          </Card>

          {/* Form Data Upload Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image size={20} />
                Form Data 업로드 API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file-input">이미지 선택</Label>
                <Input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={testFormDataUpload}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <Upload size={16} className="mr-2" />
                  Form Data 업로드
                </Button>
                <Button
                  variant="outline"
                  onClick={() => copyApiExample('formdata')}
                >
                  <Copy size={16} />
                </Button>
              </div>

              <div className="text-xs text-slate-500 space-y-1">
                <div>POST /api/upload</div>
                <div className="text-green-600">✓ 응답에 shortUrl 포함</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Response Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              API 응답
              {response && (
                <Button variant="outline" size="sm" onClick={copyResponse}>
                  <Copy size={16} className="mr-2" />
                  복사
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={response || "아직 API를 호출하지 않았습니다"}
              readOnly
              className="min-h-[300px] font-mono text-sm"
              placeholder="API 응답이 여기에 표시됩니다..."
            />
          </CardContent>
        </Card>

        {/* API Documentation */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>API 사용법</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Base64 업로드</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Content-Type: application/json</li>
                  <li>• 이미지를 base64로 인코딩해서 전송</li>
                  <li>• 여러 이미지 동시 업로드 가능</li>
                  <li>• 웹 애플리케이션에서 사용하기 적합</li>
                  <li className="text-green-600">• 응답에 shortUrl 자동 포함</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Form Data 업로드</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Content-Type: multipart/form-data</li>
                  <li>• 파일을 직접 전송</li>
                  <li>• 최대 10개 파일 동시 업로드</li>
                  <li>• 서버 간 통신에 적합</li>
                  <li className="text-green-600">• 응답에 shortUrl 자동 포함</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}