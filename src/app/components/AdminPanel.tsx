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
  FileTextIcon,
} from "lucide-react";

const formSchema = z.object({
  id: z.string().min(1, "ID is required"),
  text: z.string().min(1, "Text is required"),
  jurisdiction: z.string().min(1, "Jurisdiction is required"),
  source: z.string().url("Must be a valid URL"),
  lastReformDate: z
    .string()
    .regex(/^\d{4}\/\d{2}\/\d{2}$/, "Must be in YYYY/MM/DD format"),
  title: z.string().min(1, "Title is required").toUpperCase(),
});

type FormValues = z.infer<typeof formSchema>;

const AdminPanel: React.FC = () => {
  const [isIdExist, setIsIdExist] = useState<boolean | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: "",
      text: "",
      jurisdiction: "",
      source: "",
      lastReformDate: "",
      title: "",
    },
  });

  const checkIdExistence = (id: string) => {
    console.log(`Checking if ID ${id} exists in the database`);
    setTimeout(() => {
      setIsIdExist(Math.random() < 0.5);
    }, 1000);
  };

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "id" && value.id) {
        checkIdExistence(value.id);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const onSubmit: SubmitHandler<FormValues> = (data: FormValues) => {
    const actionType = isIdExist ? "Update" : "Upload";
    console.log(`${actionType} action - Form Data:`);
    console.log(JSON.stringify(data, null, 2));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const text = e.target?.result;
        form.setValue("text", text as string);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen  flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Law Admin Panel
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Upload or Update law information
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    ID
                  </FormLabel>
                  <div className="flex items-center space-x-2">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter law ID"
                        className="flex-grow rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                      />
                    </FormControl>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="text-teal-600 border-teal-600 hover:bg-teal-50"
                    >
                      <SearchIcon className="h-4 w-4" />
                      <span className="sr-only">Search ID</span>
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Text
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter law text here"
                      className="h-32 rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                    />
                  </FormControl>
                  <FormDescription className="text-sm text-gray-500">
                    Upload a .txt file or enter the law text manually.
                  </FormDescription>
                  <div className="mt-2">
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-teal-700 bg-teal-100 hover:bg-teal-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                    >
                      <FileTextIcon className="mr-2 h-5 w-5" />
                      Upload .txt file
                    </label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="jurisdiction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Jurisdiction
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., MX, TTII, MX-CMX"
                        className="rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Source URL
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="url"
                        placeholder="https://example.com/law-document.txt"
                        className="rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastReformDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Last Reform Date
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="YYYY/MM/DD"
                        className="rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Title
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="LAW TITLE"
                        onChange={(e) =>
                          field.onChange(e.target.value.toUpperCase())
                        }
                        className="rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-center space-x-4 mt-8">
              {isIdExist === false && (
                <Button
                  type="submit"
                  className="w-40 bg-teal-600 hover:bg-teal-700 focus:ring-teal-500 focus:ring-offset-teal-200 text-white transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg"
                >
                  <UploadIcon className="mr-2 h-5 w-5" /> Upload
                </Button>
              )}
              {isIdExist === true && (
                <Button
                  type="submit"
                  className="w-40 bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 focus:ring-offset-blue-200 text-white transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg"
                >
                  <RefreshCwIcon className="mr-2 h-5 w-5" /> Update
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default AdminPanel;
