"use client";

import React, { useState } from "react";
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

const formSchema = z.object({
  text: z.string().min(1, "Text is required"),
  jurisdiction: z.string().min(1, "Jurisdiction is required"),
  source: z.string().url("Must be a valid URL"),
  lastReformDate: z
    .string()
    .regex(/^\d{4}\/\d{2}\/\d{2}$/, "Must be in YYYY/MM/DD format"),
  title: z.string().min(1, "Title is required"),
  id: z.string().min(1, "ID is required"),
});

type FormValues = z.infer<typeof formSchema>;

const AdminPanel: React.FC = () => {
  const [isUpdate, setIsUpdate] = useState<boolean>(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      jurisdiction: "",
      source: "",
      lastReformDate: "",
      title: "",
      id: "",
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data: FormValues) => {
    const actionType = isUpdate ? "Update" : "Upload";
    const jsonData = JSON.stringify(data, null, 2);
    console.log(`${actionType} action - Form Data:`);
    console.log(jsonData);
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
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

        <FormField
          control={form.control}
          name="jurisdiction"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jurisdiction</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., MX, TTII, MX-CMX" />
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
          control={form.control}
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
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} placeholder="LAW TITLE IN ALL CAPS" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Unique identifier" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex space-x-4">
          <Button type="submit" onClick={() => setIsUpdate(false)}>
            Upload
          </Button>
          <Button type="submit" onClick={() => setIsUpdate(true)}>
            Update
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AdminPanel;
