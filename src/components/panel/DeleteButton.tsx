"use client";

export default function DeleteButton({
  id,
  filePath,
  fileFieldName = "pdf_path",
  action,
}: {
  id: string;
  filePath?: string | null;
  fileFieldName?: string;
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name={fileFieldName} value={filePath ?? ""} />
      <button
        type="submit"
        className="text-sm text-red-600 transition-colors hover:underline dark:text-red-400"
      >
        Usuń
      </button>
    </form>
  );
}
