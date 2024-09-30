"use client";
import AdminPanel from "./components/AdminPanel";
import { Amplify } from "aws-amplify";
import outputs from "../../amplify_outputs.json";
import { Authenticator } from "@aws-amplify/ui-react";
import '@aws-amplify/ui-react/styles.css';

export default function Home() {
  Amplify.configure(outputs, { ssr: true });

  return (
    <main className="container mx-auto p-4">
      <Authenticator>
        <AdminPanel />
      </Authenticator>
    </main>
  );
}
