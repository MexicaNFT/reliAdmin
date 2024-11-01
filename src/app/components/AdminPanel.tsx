"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { fetchAuthSession } from "aws-amplify/auth";
import { Button } from "@/components/ui/button";
import { get, post } from "aws-amplify/api";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { UploadIcon, RefreshCwIcon, FileIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const singleUploadSchema = z.object({
  id: z
    .string()
    .min(1, "ID is required")
    .refine(
      (id) => {
        // Regex to match your specified format
        const idRegex = /^\d+\.\d{5}$/;
        return idRegex.test(id);
      },
      {
        message:
          "ID must be in the format 'natural_number.XXXXX' (e.g., 100.00001), where the first part is a natural number and the second part is a 5-digit number",
      }
    ),
  jurisdiction: z.string().min(1, "Jurisdiction is required"),
  source: z.string().url("Must be a valid URL"),
  lastReformDate: z
    .string()
    .min(1, "Last reform date is required")
    .refine(
      (date) => {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD format
        return dateRegex.test(date) && !isNaN(Date.parse(date));
      },
      {
        message: "Must be a valid date in YYYY-MM-DD format",
      }
    ),
  name: z
    .string()
    .min(1, "Name is required")
    .transform((str) => str.toUpperCase()),
});

type SingleUploadFormValues = z.infer<typeof singleUploadSchema>;

export default function Component({ apiName }: { apiName: string }) {
  const [isBulkUpload, setIsBulkUpload] = useState(false);
  const [bulkResult, setBulkResult] = useState<any>(null);
  const [isIdExist, setIsIdExist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [associatedCompendiums, setAssociatedCompendiums] = useState<any>([]);
  const [compendiumID, setCompendiumID] = useState<string>(""); // New state for compendiumID

  const getAuthToken = async () => {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken;
    if (!token) throw new Error("No token found in session");
    return String(token);
  };

  const singleUploadForm = useForm<SingleUploadFormValues>({
    resolver: zodResolver(singleUploadSchema),
    defaultValues: {
      id: "",
      jurisdiction: "",
      source: "",
      lastReformDate: "",
      name: "",
    },
  });

  const debounceRef = useRef<any>();

  // Check if law ID exists and set initial form values
  useEffect(() => {
    const validIdRegex = /^\d+\.\d{5}$/; // Matches 'natural_number.XXXXX'

    const checkIdExistence = async (id: string) => {
      setLoading(true);
      setAssociatedCompendiums([]); // Reset associated compendiums
      const authToken = await getAuthToken();
      try {
        const restOperation = get({
          apiName: apiName,
          path: `law/${id}`,
          options: { headers: { Authorization: authToken } },
        });
        const response = await restOperation.response;
        const law = (await response.body.json()) as any;

        if (law?.id) {
          setIsIdExist(true);
          singleUploadForm.setValue("jurisdiction", law.jurisdiction);
          singleUploadForm.setValue("source", law.source);
          singleUploadForm.setValue("lastReformDate", law.lastReformDate);
          singleUploadForm.setValue("name", law.name);

          // Set download URL if it exists
          if (law.downloadUrl) {
            setDownloadUrl(law.downloadUrl);
          } else {
            setDownloadUrl(null); // Reset if no download URL
          }

          // Set associated compendiums if they exist
          if (law.associatedCompendiums) {
            setAssociatedCompendiums(law.associatedCompendiums);
          } else {
            setAssociatedCompendiums([]); // Reset if no associated compendiums
          }
        } else {
          setIsIdExist(false);
          singleUploadForm.setValue("jurisdiction", "");
          singleUploadForm.setValue("source", "");
          singleUploadForm.setValue("lastReformDate", "");
          singleUploadForm.setValue("name", "");
          setDownloadUrl(null); // Reset download URL if law doesn't exist
          setAssociatedCompendiums([]); // Reset associated compendiums
        }
      } catch (error) {
        console.log("GET call failed:", error);
        setIsIdExist(false);
        setDownloadUrl(null); // Reset download URL if GET call fails
        setAssociatedCompendiums([]); // Reset associated compendiums
        singleUploadForm.setValue("jurisdiction", "");
        singleUploadForm.setValue("source", "");
        singleUploadForm.setValue("lastReformDate", "");
        singleUploadForm.setValue("name", "");
      } finally {
        setLoading(false);
      }
    };

    const debouncedCheckIdExistence = (id: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => checkIdExistence(id), 1000);
    };

    const subscription = singleUploadForm.watch((value, { name }) => {
      if (name === "id" && value.id) {
        // Only call the debounced check if the id matches the valid format
        if (validIdRegex.test(value.id)) {
          debouncedCheckIdExistence(value.id);
        } else {
          setIsIdExist(false); // Optionally reset existence state if invalid
          setDownloadUrl(null); // Optionally reset download URL if invalid
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [singleUploadForm, setIsIdExist, setDownloadUrl]);

  // Function to submit metadata and retrieve pre-signed URL
  const onSingleUploadSubmit: SubmitHandler<SingleUploadFormValues> = async (
    data
  ) => {
    setLoading(true);
    const authToken = await getAuthToken();
    try {
      const restOperation = post({
        apiName: apiName,
        path: `law`,
        options: {
          headers: { Authorization: authToken },
          body: { ...data },
        },
      });
      const response = await restOperation.response;
      const result = (await response.body.json()) as any;
      setUploadUrl(result.uploadUrl);
    } catch (error) {
      console.error("Failed to upsert metadata:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle file upload to S3 using pre-signed URL
  const handleTXTUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!uploadUrl) {
      alert("Please submit metadata to retrieve an upload URL.");
      return;
    }
    const file = event.target.files?.[0];
    if (file) {
      try {
        const response = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": "text/plain" },
          body: file,
        });
        if (response.ok) {
          alert("File uploaded successfully!");
          setUploadUrl(null);
          singleUploadForm.reset();
        } else {
          throw new Error("Failed to upload file");
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        alert(
          "Failed to upload file. CONTACT AN ADMIN TO ENSURE DATA INTEGRITY"
        );
      }
    }
  };

  const uploadMultipleLaws = async () => {
    const input = document.getElementById("csv") as HTMLInputElement;
    const file = input?.files?.[0];

    if (!file) {
      alert("No file provided");
      return;
    }

    if (!compendiumID) {
      alert("No compendium ID provided");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const fileContent = reader.result as string;
      const base64File = btoa(fileContent); // Encode file content to base64

      const authToken = await getAuthToken();
      try {
        const restOperation = post({
          apiName: apiName, // Use the appropriate API name
          path: `laws`, // Target the /laws endpoint
          options: {
            headers: { Authorization: authToken },
            body: {
              csvFile: base64File,
              compendiumID,
            },
          },
        });

        const response = await restOperation.response;
        const result = await response.body.json();
        setCompendiumID(""); // Reset compendium ID
        input.value = ""; // Clear file input
        setBulkResult(result);
        console.log("Bulk upload result:", result);
        alert("File uploaded successfully");
      } catch (error) {
        console.error("Failed to upload file:", error);
        alert("Error uploading file");
      }
    };

    reader.readAsText(file); // Read the file as text to base64 encode it
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center text-primary">
            Law Admin Panel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue={isBulkUpload ? "bulk" : "single"}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="single"
                onClick={() => setIsBulkUpload(false)}
              >
                Single Upload
              </TabsTrigger>
              <TabsTrigger value="bulk" onClick={() => setIsBulkUpload(true)}>
                Bulk Upload
              </TabsTrigger>
            </TabsList>
            <TabsContent value="single">
              <Form {...singleUploadForm}>
                <form
                  onSubmit={singleUploadForm.handleSubmit(onSingleUploadSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={singleUploadForm.control}
                    name="id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter law ID"
                            className="flex-grow"
                            disabled={
                              singleUploadForm.formState.isSubmitting ||
                              loading ||
                              !!uploadUrl
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {uploadUrl && (
                    <FormItem>
                      <FormLabel>Text File</FormLabel>
                      <FormDescription>
                        Now, upload the text file.
                      </FormDescription>

                      <Input
                        type="file"
                        accept=".txt"
                        onChange={handleTXTUpload}
                        className="mt-2"
                        disabled={
                          loading || singleUploadForm.formState.isSubmitting
                        }
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          setUploadUrl(null);
                          singleUploadForm.reset();
                          alert("Metadata updated, old file kept intact");
                        }}
                        className="mt-2"
                        disabled={
                          loading ||
                          singleUploadForm.formState.isSubmitting ||
                          !isIdExist
                        }
                      >
                        {isIdExist
                          ? "Click here if you don't want to update the law text document"
                          : "Please ensure to upload the file to ensure data integrity"}
                      </Button>
                    </FormItem>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={singleUploadForm.control}
                      name="jurisdiction"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jurisdiction</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g., MX, TTII, MX-CMX"
                              disabled={
                                loading ||
                                singleUploadForm.formState.isSubmitting ||
                                !!uploadUrl
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={singleUploadForm.control}
                      name="source"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source URL</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="url"
                              placeholder="https://example.com/law-document.txt"
                              disabled={
                                loading ||
                                singleUploadForm.formState.isSubmitting ||
                                !!uploadUrl
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={singleUploadForm.control}
                      name="lastReformDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Reform Date</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="YYYY-MM-DD"
                              disabled={
                                loading ||
                                singleUploadForm.formState.isSubmitting ||
                                !!uploadUrl
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={singleUploadForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="LAW NAME"
                              disabled={
                                loading ||
                                singleUploadForm.formState.isSubmitting ||
                                !!uploadUrl
                              }
                              onChange={(e) =>
                                field.onChange(e.target.value.toUpperCase())
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {!uploadUrl && (
                    <div className="flex justify-center space-x-4">
                      <Button
                        type="submit"
                        className="w-32"
                        disabled={
                          loading || singleUploadForm.formState.isSubmitting
                        }
                      >
                        {isIdExist ? (
                          <>
                            <RefreshCwIcon className="mr-2 h-4 w-4" />{" "}
                            <>Update</>
                          </>
                        ) : (
                          <>
                            <UploadIcon className="mr-2 h-4 w-4" /> <>Upload</>
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {downloadUrl && singleUploadForm.getValues("id") ? (
                    <div className="mt-4">
                      <a
                        href={downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline"
                      >
                        View Law Text
                      </a>
                    </div>
                  ) : (
                    // RED MESSAGE TO ALERT USER TO UPLOAD FILE
                    <div className="mt-4 text-red-600">
                      <p>
                        NO S3 FILE FOUND: Upload the text file to ensure data
                        integrity
                      </p>
                    </div>
                  )}
                </form>
                {associatedCompendiums && associatedCompendiums.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold">
                      Associated Compendiums
                    </h3>
                    <div className="space-y-4">
                      {associatedCompendiums.map((compendium: any) => (
                        <div
                          key={compendium?.id}
                          className="border p-4 rounded-md shadow-sm"
                        >
                          <p>
                            <span className="font-semibold">
                              Compendium ID:
                            </span>{" "}
                            {compendium.compendiumId}
                          </p>
                          <p>
                            <span className="font-semibold">
                              Compendium Name:
                            </span>{" "}
                            {compendium?.compendium?.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Create Compendium Law association */}
                {singleUploadForm.getValues("id") && !loading && isIdExist && (
                  <div className="mt-6">
                    <form
                      className="space-y-4"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const compendiumId = prompt("Enter Compendium ID");
                        if (compendiumId) {
                          const authToken = await getAuthToken();
                          try {
                            const restOperation = post({
                              apiName: apiName,
                              path: `compendiumLaw`,
                              options: {
                                headers: { Authorization: authToken },
                                body: {
                                  compendiumId,
                                  lawId: singleUploadForm.getValues("id"),
                                },
                              },
                            });
                            const response = await restOperation.response;
                            const result = await response.body.json();
                            console.log(
                              "Compendium Law association result:",
                              result
                            );
                            alert(
                              "Compendium Law association created successfully, refresh the page to see the updated list"
                            );
                          } catch (error) {
                            console.error(
                              "Failed to create Compendium Law association:",
                              error
                            );
                            alert("Error creating Compendium Law association");
                          }
                        }
                      }}
                    >
                      <Button type="submit">+</Button>
                    </form>
                  </div>
                )}
              </Form>
            </TabsContent>
            <TabsContent value="bulk">
              <form className="space-y-6 flex flex-col items-center">
                <p className="text-center text-lg">
                  Upload a CSV file containing multiple laws
                </p>
                <p className="text-center text-sm text-gray-600">
                  CSV file must contain columns: "jurisdiction", "source",
                  "last_reform_date", "title", "Id"
                </p>
                <p className="text-center text-sm text-gray-600">
                  Manually upload all law texts to S3 after bulk upload! This will auto embed the text.
                </p>
                <div className="space-y-2">
                  <label htmlFor="compendiumID" className="block font-medium">
                    Compendium ID
                  </label>
                  <Input
                    id="compendiumID"
                    placeholder="Enter compendium ID"
                    value={compendiumID}
                    onChange={(e) => setCompendiumID(e.target.value)}
                    className="block w-full"
                    disabled={loading}
                  />
                </div>
                <input type="file" accept=".csv" id="csv" />
                <Button
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    uploadMultipleLaws();
                  }}
                  className="w-32"
                  disabled={loading}
                >
                  <FileIcon className="mr-2 h-4 w-4" /> <>Upload</>
                </Button>
                {bulkResult && (
                  <div className="mt-4">
                    <ul>
                      {bulkResult.map((result: any, index: number) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="mr-2">
                            {result.valid ? "✅" : "❌"}
                          </span>
                          <div>
                            <div className="font-medium">
                              Law ID: {result.lawID}
                            </div>
                            {!result.valid && result.errors && (
                              <ul className="list-disc list-inside text-red-600">
                                {result.errors.map(
                                  (error: string, idx: number) => (
                                    <li key={idx}>{error}</li>
                                  )
                                )}
                              </ul>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
