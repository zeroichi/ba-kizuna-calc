'use client'

import { useBondExpTable, useMasterData, useNotifications } from "@/hooks/useMasterData";
import MainPage from "./components/pages/MainPage";
import { SoftwareApplicationJsonLd } from "next-seo";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";

export default function Home() {
  const masterData = useMasterData()
  const bondExpTable = useBondExpTable()
  const notifications = useNotifications()

  const theme = createTheme({
    palette: {
      mode: "light"
    }
  });

  return (
    <>
      <SoftwareApplicationJsonLd
        type="WebApplication"
        name="ブルアカ 絆ランク 計算機/シミュレータ"
        url="https://ako.zeroichi.jp/"
        applicationCategory="UtilitiesApplication"
        offers={[
          {
            price: 0,
            priceCurrency: "JPY",
            availability: "https://schema.org/InStock",
          },
        ]}
        author={
          {
            "@type": "Person",
            name: "zeroichi",
            url: "https://www.zeroichi.jp/",
          }
        }
        datePublished="2025-11-20T15:00:00+09:00"
        dateModified="2025-12-07T12:00:00+09:00"
        screenshot={{
          url: "https://public.ako.zeroichi.jp/ba-kizuna-calc.png",
          caption: "絆ランク 計算画面",
        }}
        featureList={[
          "ブルアカ 絆ランク 計算",
          "ブルアカ 絆ランク シミュレーション",
        ]}
      />
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="flex items-center justify-center bg-zinc-50 font-sans">
          {
            masterData.data && bondExpTable.data && notifications.data
              ? <MainPage masterData={masterData.data} bondExpTable={bondExpTable.data} notifications={notifications.data} />
              : <div className="h-screen w-screen flex justify-center items-center">データをロード中...</div>
          }
        </div>
      </ThemeProvider>
    </>
  );
}
