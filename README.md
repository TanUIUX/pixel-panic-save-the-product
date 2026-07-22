# 🕹️ PIXEL PANIC — Save the Product

Một tựa game giải đố UX 2D chạy hoàn toàn trên trình duyệt (HTML5 Canvas + DOM). Bạn vào vai tân binh của **UX Rescue Unit**, giải cứu 6 “Product District” khỏi AI tối ưu lệch lạc **M.O.D.A.L** và sửa lại directive của nó.

## ▶️ Cách chơi

**Cách 1 — Chơi trực tiếp:** Tải repo về và mở file `index.html` bằng trình duyệt (Chrome, Edge, Firefox, Safari).

**Cách 2 — GitHub Pages:** Vào *Settings → Pages*, chọn nhánh `main` và thư mục gốc (`/root`). Sau vài phút, game sẽ chạy tại:

```
https://tanuiux.github.io/pixel-panic-save-the-product/
```

> Không cần cài đặt, không cần bước build. Toàn bộ game nằm trong `index.html` + `game.js`.

## 🎮 Nội dung

- Luồng chơi đầy đủ: Boot → Menu → New Game/Continue → Guest/Login → Chọn Avatar → The Grid Hub → Mission Map → 6 Mission → Boss cuối → Campaign Ending → Expert Mode.
- **6 Product District**, mỗi district rèn một kỹ năng UX: Visual Hierarchy, Form Design, Flow Architecture, Ethical Design, Accessibility, Product Strategy.
- **11 cơ chế chơi**: spot-issue, repair-choice, drag-sort, connect-flow, ux-writing-match, evidence-match, contrast calibration, keyboard-route, capacity builder, dialogue battle, và stakeholder encounter.
- Hệ thống điểm 1000/mission, xếp hạng grade **S / A / B / C / D**, XP và 7 cấp bậc từ *Pixel Intern* đến *UX Master*.
- Lưu tiến trình cục bộ (localStorage), tùy chọn hỗ trợ tiếp cận (reduced motion, relaxed timer), 3 độ khó (Guided / Standard / Expert).

## 🗂️ Cấu trúc

| File | Mô tả |
|------|-------|
| `index.html` | Khung game, style (CSS) và các phần tử overlay/canvas |
| `game.js` | Toàn bộ logic game: dữ liệu mission, scene engine, mechanics và UI |

## 🛠️ Công nghệ

Vanilla JavaScript · HTML5 Canvas · CSS — không phụ thuộc thư viện ngoài.

---

*Được tạo trong workspace AI Play Ground.*
