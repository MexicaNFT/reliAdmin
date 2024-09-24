"use client";

import React, { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  SearchIcon,
  UploadIcon,
  RefreshCwIcon,
  FileIcon,
  BookOpenIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const singleUploadSchema = z.object({
  id: z.string().min(1, "ID is required"),
  text: z.string().min(1, "Text is required"),
  jurisdiction: z.string().min(1, "Jurisdiction is required"),
  source: z.string().url("Must be a valid URL"),
  lastReformDate: z
    .string()
    .regex(/^\d{4}\/\d{2}\/\d{2}$/, "Must be in YYYY/MM/DD format"),
  title: z.string().min(1, "Title is required").toUpperCase(),
});

const bulkUploadSchema = z.object({
  file: z.instanceof(File).refine((file) => file.name.endsWith(".csv"), {
    message: "File must be a CSV",
  }),
});

type SingleUploadFormValues = z.infer<typeof singleUploadSchema>;
type BulkUploadFormValues = z.infer<typeof bulkUploadSchema>;

export default function Component() {
  const [isBulkUpload, setIsBulkUpload] = useState(false);
  const [isIdExist, setIsIdExist] = useState<boolean | null>(null);

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

  const bulkUploadForm = useForm<BulkUploadFormValues>({
    resolver: zodResolver(bulkUploadSchema),
  });

  const checkIdExistence = (id: string) => {
    console.log(`Checking if ID ${id} exists in the database`);
    setTimeout(() => {
      setIsIdExist(Math.random() < 0.5);
    }, 1000);
  };

  useEffect(() => {
    const subscription = singleUploadForm.watch((value, { name }) => {
      if (name === "id" && value.id) {
        checkIdExistence(value.id);
      }
    });
    return () => subscription.unsubscribe();
  }, [singleUploadForm.watch]);

  const onSingleUploadSubmit: SubmitHandler<SingleUploadFormValues> = (
    data
  ) => {
    const actionType = isIdExist ? "Update" : "Upload";
    console.log(`${actionType} action - Form Data:`);
    console.log(JSON.stringify(data, null, 2));
  };

  const onBulkUploadSubmit: SubmitHandler<BulkUploadFormValues> = (data) => {
    console.log("Bulk Upload - File:", data.file.name);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const text = e.target?.result;
        singleUploadForm.setValue("text", text as string);
      };
      reader.readAsText(file);
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
                        <div className="flex items-center space-x-2">
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter law ID"
                              className="flex-grow"
                            />
                          </FormControl>
                          <Button type="button" size="icon" variant="outline">
                            <SearchIcon className="h-4 w-4" />
                            <span className="sr-only">Search ID</span>
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={singleUploadForm.control}
                    name="text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Text</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter law text here"
                            className="h-32"
                          />
                        </FormControl>
                        <FormDescription>
                          Upload a .txt file or enter the law text manually.
                        </FormDescription>
                        <Input
                          type="file"
                          accept=".txt"
                          onChange={handleFileUpload}
                          className="mt-2"
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
                            <Input {...field} placeholder="YYYY/MM/DD" />
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
                    {isIdExist === false && (
                      <Button type="submit" className="w-32">
                        <UploadIcon className="mr-2 h-4 w-4" /> Upload
                      </Button>
                    )}
                    {isIdExist === true && (
                      <Button type="submit" className="w-32">
                        <RefreshCwIcon className="mr-2 h-4 w-4" /> Update
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="bulk">
              <Form {...bulkUploadForm}>
                <form
                  onSubmit={bulkUploadForm.handleSubmit(onBulkUploadSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={bulkUploadForm.control}
                    name="file"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CSV File</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept=".csv"
                            onChange={(e) =>
                              field.onChange(e.target.files?.[0])
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Upload a CSV file containing multiple law entries.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-center">
                    <Button type="submit" className="w-32">
                      <FileIcon className="mr-2 h-4 w-4" /> Upload CSV
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
