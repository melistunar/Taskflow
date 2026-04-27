# Taskflow
Taskflow, ekip içinde görevleri organize etmek ve iş akışını yönetmek için tasarlanmış, sürükle-bırak (drag-and-drop) özellikli bir Kanban uygulamasıdır.
## Özellikler
* **Kullanıcı kayıt / giriş sistemi:** localStorage ile yapıldı. 
* **Sürükle-Bırak:** `dnd-kit` kütüphanesi kullanarak görevler sütunlar arasında ve sütunlar kendi arasında taşınabilir.
* **Görev Yönetimi:** Kullanıcılar yeni görevler ve sütunlar ekleyebilir, var olan görevleri düzenleyebilir, görevleri ve sütunları silebilir, Board oluşturma ve silme yapabilir.
*   **Task detayları:**
    - Başlık
    - Açıklama
    - Priority (Low / Medium / High)
    - Due date
    - Assignee
  * **Board Erişim Türleri:**
    - Private
    - Team View (sadece görüntüleme)
    - Team Edit (düzenleme)

* **Arayüz:** Next.js ve Tailwind CSS ile hazırlandı. Mobilde ve webde kullanılabilir.

## Kullanılan Teknolojiler
* **Framework:** Next.js
* **Dil:** TypeScript
* **Stil:** Tailwind CSS
* **Kütüphane:** @dnd-kit (Drag and Drop işlevselliği için)
* **Deployment:** Vercel

## Proje Yapısı
### 1. Kanban Board:
- Kullanıcı giriş işlemleri
- Board yönetimi
- Drag & Drop mantığı
- Modal yönetimleri

### 2. Column
- Her bir kolonun UI’ı
- İçindeki task listesi
- Task ekleme ve kolon silme

### 3. TaskCard
- Task görünümü
- Priority renklendirme
- Edit / delete işlemleri

## Data Model

```js
Board {
  title,
  owner,
  accessType,
  boardData: {
    columnId: {
      title,
      items: [tasks]
    }
  },
  columnOrder: []
}
```

Bu yapı sayesinde:
- Kolon sırası ayrı tutuluyor
- Task’lar kolon içinde listeleniyor
- Drag & drop işlemleri kolaylaşıyor

## Drag & Drop Library Choice

### Neden dnd-kit?

- Modern ve aktif olarak geliştiriliyor  
- React ile uyumlu  
- Çok esnek (column + task drag aynı anda yapılabiliyor)  
- Mobile desteği iyi (touch sensor var)

## Sorting Logic

Kartların sırası kaybolmaması için:

- Tüm state localStorage’a kaydediliyor
- Her kolon kendi `items` array’ini tutuyor
- Sıralama:
  - `arrayMove()` ile güncelleniyor

Bu sayede:
- Refresh sonrası sıra korunuyor  
- Veri tutarlı kalıyor  

## Mobile Compatibility

Mobil için:

- `TouchSensor` kullanıldı
- Uzun basma ile sürükleme başlıyor (delay ayarı var)
- Responsive tasarım:
  - Flex layout
  - Scrollable board
 
## Project Link
https://taskflowproject-self.vercel.app

