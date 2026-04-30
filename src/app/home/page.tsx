import { Metadata } from "next";
import HomeGatewayClient from "./HomeGatewayClient";

export const metadata: Metadata = {
  title: "Home",
  description: "Choose available services for your university",
};

export default function HomeGatewayPage() {
  return <HomeGatewayClient />;
}
