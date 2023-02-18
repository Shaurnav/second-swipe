import Head from "next/head";

import Header from "../components/Header";
import LeftHandSide from "../components/LeftHandSide";
import RightHandSide from "../components/RightHandSide";

import icon from "../assets/icon.png";

export default function Home() {
  return (
    <div>
      <Head>
        <title>SecondSwipe</title>
        <meta name="description" content="Generated by create next app" />
        <link
          rel="icon"
          href="https://i.ibb.co/VNcLY61/icon.png"
        />
      </Head>
      <Header isShow={true} />
      <main>
        <LeftHandSide />
        <RightHandSide />
      </main>
    </div>
  );
}
