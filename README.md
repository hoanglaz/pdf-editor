# PDF Editor Frontend MVP

Ứng dụng React + Vite + TypeScript để tạo template field cho PDF Service API, validate payload phía frontend, gọi các endpoint backend và tải file PDF trả về từ `/api/pdf/convert`.

## Tính năng

- Upload file PDF với kiểm tra định dạng `.pdf`
- Tạo và chỉnh sửa danh sách field động cho `TEXT` và `CHECKBOX`
- Validate dữ liệu template và field trước khi gọi API
- Xem JSON preview của payload gửi backend
- Gọi `POST /api/pdf/template/export` để validate/export template
- Gọi `POST /api/pdf/convert` bằng `multipart/form-data` và tự tải file PDF trả về
- Gọi `GET /api/pdf/generate` để test nhanh backend
- Hiển thị response backend và lỗi chuẩn hóa từ Axios

## Tech Stack

- React 19
- TypeScript
- Vite
- Axios
- CSS thuần

## Cấu trúc chính

```text
src/
  components/
    JsonPreview/
      JsonPreview.tsx
    PdfUpload/
      PdfUpload.tsx
    ResponsePanel/
      ResponsePanel.tsx
    TemplateForm/
      FieldItem.tsx
      TemplateForm.tsx
  pages/
    HomePage.tsx
  services/
    http.ts
    pdfApi.ts
  types/
    pdf.ts
  utils/
    download.ts
    validators.ts
  App.tsx
  index.css
  main.tsx
```

## Cài đặt

```bash
npm install
```

## Cấu hình môi trường

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Giá trị mặc định:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Frontend sẽ gọi backend qua base URL này và tự nối thêm prefix `/api/pdf` ở service layer.

## Chạy môi trường dev

```bash
npm run dev
```

## Build production

```bash
npm run build
```

## Flow sử dụng

1. Nhập `templateName` và `version`
2. Upload file PDF
3. Thêm hoặc sửa field `TEXT` / `CHECKBOX`
4. Kiểm tra JSON preview ở panel bên phải
5. Bấm `Validate Template` để gửi payload JSON lên backend
6. Bấm `Convert PDF` để gửi file + template và nhận file PDF trả về
7. Bấm `Test Generate` để gọi endpoint GET test nhanh

## Contract backend đang dùng

### `POST /api/pdf/convert`

- Content type: `multipart/form-data`
- Part `file`: file PDF
- Part `template`: chuỗi JSON hợp lệ

### `POST /api/pdf/template/export`

- Content type: `application/json`
- Body: object template

### `GET /api/pdf/generate`

- Response text: `PDF generated successfully!`

## Mở rộng tiếp theo

1. Thêm preview PDF trực tiếp bằng `react-pdf` hoặc iframe blob URL
2. Đồng bộ field với click tọa độ trên canvas PDF
3. Thêm lưu template local hoặc gọi API CRUD template nếu backend hỗ trợ
