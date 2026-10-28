import { getRegistration } from "@/lib/registration-store";
import { hasRole } from "@/lib/registration";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { auth, isAuthConfigured } from "@/auth";
import {
  isSameOrigin,
  isSupportedImage,
  MAX_IMAGE_BYTES,
} from "@/lib/validation";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isSameOrigin(request))
    return Response.json({ error: "不正なリクエストです。" }, { status: 403 });
  if (!isAuthConfigured())
    return Response.json(
      { error: "認証を設定してください。" },
      { status: 503 },
    );
  try {
    const session = await auth();
    if (!session?.user.id)
      return Response.json({ error: "ログインが必要です。" }, { status: 401 });
    const registration = await getRegistration(session.user.id);
    if (!hasRole(registration?.role, "creator"))
      return Response.json(
        { error: "画像の掲載にはクリエイター登録が必要です。" },
        { status: 403 },
      );
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
      process.env;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET)
      return Response.json(
        {
          error:
            "Cloudinaryの環境変数を設定してください。画像URLでの登録も利用できます。",
        },
        { status: 503 },
      );
    if (Number(request.headers.get("content-length")) > MAX_IMAGE_BYTES + 65536)
      return Response.json(
        { error: "画像は4MB以下にしてください。" },
        { status: 413 },
      );
    const form = await request.formData();
    const file = form.get("file");
    if (
      !(file instanceof File) ||
      file.size === 0 ||
      file.size > MAX_IMAGE_BYTES
    )
      return Response.json(
        { error: "4MB以下の画像ファイルを選択してください。" },
        { status: 400 },
      );
    const bytes = Buffer.from(await file.arrayBuffer());
    if (!isSupportedImage(bytes))
      return Response.json(
        { error: "JPEG・PNG・WebP・GIFの画像を選択してください。" },
        { status: 400 },
      );
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    });
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "image",
          asset_folder: "find-good",
          allowed_formats: ["jpg", "png", "webp", "gif"],
          overwrite: false,
        },
        (error, result) => {
          if (error || !result) reject(error ?? new Error("Upload failed"));
          else resolve(result);
        },
      );
      stream.end(bytes);
    });
    return Response.json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error("Upload failed", error);
    return Response.json(
      { error: "アップロードに失敗しました。設定や画像を確認してください。" },
      { status: 500 },
    );
  }
}
