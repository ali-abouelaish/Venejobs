import { Geist, DM_Sans } from "next/font/google";
import { ToastContainer } from 'react-toastify';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

export const metadata = {
  title: "Venejobs",
  description: "Effortless hiring, inspired work with Venejobs.",
};

export default function RootLayout({ children }) {
 

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${dmSans.className}  antialiased`}
      >
         
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
