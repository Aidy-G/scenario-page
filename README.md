# דף קשר (Contact Page)

אפליקציה ליצירת דפי קשר עם תמונות לגנים:
- בחירת כמות תמונות, עימוד וצבע
- גרירה או העלאה של תמונות
- כיתוב מתחת לכל תמונה + ניקוד
- תאריך עברי אוטומטי
- הדפסה של 2 דפי A5 על עמוד A4

## קבצי רקע נדרשים

לפני העלאה ל-GitHub, ודאי שבתיקיית `assets/` יש:
- `yellow-bg.png`
- `blue-bg.png`
- `green-bg.png`
- `pink-bg.png`
- `photo-frame.png`

## שימוש מקומי

1. פתחי את `index.html` ב-Chrome או Edge.
2. לשמירה נוחה: קיצור דרך לשולחן העבודה.

## פרסום ב-GitHub Pages (קישור לכל הסניפים)

### שלב 1 — הכנה (פעם אחת)

1. צרי חשבון ב-[GitHub](https://github.com) אם אין.
2. ודאי שכל קבצי הרקע נמצאים ב-`assets/`.
3. בטרמינל, מתוך תיקיית הפרויקט:

```powershell
git init
git add .
git commit -m "Initial commit: contact page app"
```

### שלב 2 — יצירת repo והעלאה

**אפשרות א' — דרך האתר (הכי פשוט)**

1. ב-GitHub: **New repository**
2. שם: `contact-page`
3. Public, בלי README (כבר יש לנו)
4. אחרי יצירה, הריצי את הפקודות ש-GitHub מציג (בערך):

```powershell
git remote add origin https://github.com/שם-המשתמש/contact-page.git
git branch -M main
git push -u origin main
```

**אפשרות ב' — GitHub CLI**

```powershell
gh auth login
gh repo create contact-page --public --source=. --remote=origin --push
```

### שלב 3 — הפעלת GitHub Pages

1. ב-repo: **Settings → Pages**
2. **Source:** Deploy from a branch
3. **Branch:** `main` → `/ (root)` → **Save**
4. אחרי 1–2 דקות יופיע קישור, למשל:
   `https://שם-המשתמש.github.io/contact-page/`

### שלב 4 — הפצה לסניפים

שלחי לכל הסניפים את הקישור + קיצור דרך בדפדפן. זהו.

## עדכון גרסה (כשאת משנה משהו)

```powershell
git add .
git commit -m "תיאור השינוי"
git push
```

תוך דקה־שתיים כל הסניפים מקבלים את העדכון ברענון הדף.

## הדפסה

בהדפסה יש לבחור:
- Paper Size: A4
- Orientation: Landscape
- Background graphics: מופעל
- Scale: 100%
