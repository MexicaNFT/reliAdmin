"use client";
import AdminPanel from "./components/AdminPanel";
import { Amplify } from "aws-amplify";
import outputs from "../../amplify_outputs.json";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

const apiName = outputs.custom.API
  ? Object.keys(outputs.custom.API)[0] // This retrieves the first key
  : "adminApi";

export default function Home() {
  Amplify.configure(outputs);
  const existingConfig = Amplify.getConfig();
  Amplify.configure({
    ...existingConfig,
    API: {
      ...existingConfig.API,
      REST: outputs.custom.API,
    },
  });

  return (
    <main className="container mx-auto p-4">
      <Authenticator hideSignUp>
        {({ signOut }) => (
          <>
            <AdminPanel apiName={apiName} />
            <button onClick={signOut}>Sign out</button>
          </>
        )}
      </Authenticator>
    </main>
  );
}
