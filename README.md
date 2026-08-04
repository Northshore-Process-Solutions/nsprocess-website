# nsprocess-website

Company website for **North Shore Process Solutions**.

- **Live URL:** https://nsprocess.com (connect after deploy)
- **Stack:** Static HTML / CSS
- **Org:** [nsprocess](https://github.com/nsprocess) *(update if your org name differs)*

## Local development

Open `index.html` in a browser, or run a simple local server:

```bash
python -m http.server 8080
```

Then visit http://localhost:8080

## Deploy

1. Push this repo to GitHub under your org as `nsprocess-website`
2. Connect the repo to [Vercel](https://vercel.com), [Netlify](https://netlify.com), or [Cloudflare Pages](https://pages.cloudflare.com)
3. Add custom domain `nsprocess.com` in the host dashboard
4. Update DNS at your domain registrar to point to the host

## Repo setup (first push)

```bash
git add .
git commit -m "Initial company website setup"
git branch -M main
git remote add origin https://github.com/YOUR-ORG/nsprocess-website.git
git push -u origin main
```

Replace `YOUR-ORG` with your GitHub organization name.
