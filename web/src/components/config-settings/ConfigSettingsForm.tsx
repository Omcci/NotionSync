import { useConfigContext } from "@/context/ConfigContext";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { Button } from "../ui/button";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";

const configSchema = z.object({
  repository: z.string().min(1, "Repository is required"),
  organization: z.string().min(1, "Organization is required"),
  githubToken: z.string().min(1, "GitHub Token is required"),
  notionToken: z.string().min(1, "Notion Token is required"),
});

type ConfigSchema = z.infer<typeof configSchema>;

const ConfigSettingsForm = () => {
  const { config, setConfig } = useConfigContext();
  const methods = useForm<ConfigSchema>({
    resolver: zodResolver(configSchema),
    defaultValues: config,
  });

  const { control, handleSubmit, reset } = methods;

  const onSubmit = async (data: ConfigSchema) => {
    setConfig(data);
    await fetch("/api/config", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    reset(data);
  };

  useEffect(() => {
    reset(config);
  }, [config, reset]);
  console.log(config);

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <FormField
          control={control}
          name="repository"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel htmlFor="repository">Repository</FormLabel>
              <FormControl>
                <Input {...field} id="repository" type="text" />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="organization"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel htmlFor="organization">Organization</FormLabel>
              <FormControl>
                <Input {...field} id="organization" type="text" />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="githubToken"
          render={({ field, fieldState }) => (
            <FormItem className="space-y-2">
              <FormLabel htmlFor="githubToken">GitHub Token</FormLabel>
              <FormControl>
                <Input {...field} id="githubToken" type="password" />
              </FormControl>
              {fieldState.error && (
                <p className="text-red-500">{fieldState.error.message}</p>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="notionToken"
          render={({ field, fieldState }) => (
            <FormItem className="space-y-2">
              <FormLabel htmlFor="notionToken">Notion Token</FormLabel>
              <FormControl>
                <Input {...field} id="notionToken" type="password" />
              </FormControl>
              {fieldState.error && (
                <p className="text-red-500">{fieldState.error.message}</p>
              )}
            </FormItem>
          )}
        />
        <div />

        <div className="flex justify-end">
          <Button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 "
          >
            Save Settings
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};

export default ConfigSettingsForm;
