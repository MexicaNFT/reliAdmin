"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
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
  id: z.string().min(1, "ID is required"),
  text: z.string().min(1, "Text is required"),
  jurisdiction: z.string().min(1, "Jurisdiction is required"),
  source: z.string().url("Must be a valid URL"),
  lastReformDate: z
    .string()
    .min(1, "Last reform date is required")
    .refine(
      (date) => {
        const isoDateRegex =
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
        return isoDateRegex.test(date) && !isNaN(Date.parse(date));
      },
      {
        message: "Must be a valid ISO 8601 date",
      }
    ),
  title: z
    .string()
    .min(1, "Title is required")
    .transform((str) => str.toUpperCase()),
});

type SingleUploadFormValues = z.infer<typeof singleUploadSchema>;

export default function Component() {
  const [isBulkUpload, setIsBulkUpload] = useState(false);
  const [isIdExist, setIsIdExist] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [compendiumID, setCompendiumID] = useState<string>(""); // New state for compendiumID

  const singleUploadForm = useForm<SingleUploadFormValues>({
    resolver: zodResolver(singleUploadSchema),
    defaultValues: {
      id: "",
      text: "",
      jurisdiction: "",
      source: "",
      lastReformDate: "",
      title: "",
    },
  });

  const debounceRef = useRef<any>();

  useEffect(() => {
    const checkIdExistence = async (id: string) => {
      setLoading(true);
      const response = await fetch(`/api/fetch?id=${id}`);
      const result = await response.json();
      const law = result?.data?.law;

      if (law?.id) {
        setIsIdExist(true);
        singleUploadForm.setValue("jurisdiction", law.jurisdiction);
        singleUploadForm.setValue("source", law.source);
        singleUploadForm.setValue("lastReformDate", law.lastReformDate);
        singleUploadForm.setValue("title", law.name);
      } else {
        setIsIdExist(false);
        singleUploadForm.setValue("jurisdiction", "");
        singleUploadForm.setValue("source", "");
        singleUploadForm.setValue("lastReformDate", "");
        singleUploadForm.setValue("title", "");
      }
      setLoading(false);
    };

    const debouncedCheckIdExistence = (id: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        checkIdExistence(id);
      }, 1000);
    };

    const subscription = singleUploadForm.watch((value, { name }) => {
      if (name === "id" && value.id) {
        debouncedCheckIdExistence(value.id);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [singleUploadForm, setIsIdExist]);

  const onSingleUploadSubmit: SubmitHandler<SingleUploadFormValues> = (
    data
  ) => {
    const actionType = isIdExist ? "Update" : "Upload";
    console.log(`${actionType} action - Form Data:`);
    console.log(JSON.stringify(data, null, 2));
  };

  const handleTXTUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    // TODO: Handle the logic to read and process the .txt file
  };

  const uploadMultipleLaws = async () => {
    const input = document.getElementById("csv") as HTMLInputElement;
    const file = input?.files?.[0];

    if (!file || !compendiumID) {
      alert("No file or compendium ID provided");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("compendiumID", compendiumID); // Append compendiumID to formData

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("File uploaded successfully");
      } else {
        alert("Error uploading file");
      }
    } catch (error) {
      alert("Error uploading file");
      console.error(error);
    }
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
                            disabled={singleUploadForm.formState.isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={singleUploadForm.control}
                    name="text"
                    render={() => (
                      <FormItem>
                        <FormLabel>Text</FormLabel>
                        <FormDescription>Upload a .txt file</FormDescription>
                        <Input
                          type="file"
                          accept=".txt"
                          onChange={handleTXTUpload}
                          className="mt-2"
                          disabled={
                            loading || singleUploadForm.formState.isSubmitting
                          }
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                                singleUploadForm.formState.isSubmitting
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
                                singleUploadForm.formState.isSubmitting
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
                              placeholder="YYYY/MM/DD"
                              disabled={
                                loading ||
                                singleUploadForm.formState.isSubmitting
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={singleUploadForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="LAW TITLE"
                              disabled={
                                loading ||
                                singleUploadForm.formState.isSubmitting
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
                          <UploadIcon className="mr-2 h-4 w-4" /> <>Update</>
                        </>
                      ) : (
                        <>
                          <RefreshCwIcon className="mr-2 h-4 w-4" /> <>Upload</>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="bulk">
              <form className="space-y-6">
                {/* Compendium ID Field */}
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
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}