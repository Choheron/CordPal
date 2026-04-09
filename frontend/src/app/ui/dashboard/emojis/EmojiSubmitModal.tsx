'use client'

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from "@heroui/modal";
import { addToast, Button } from "@heroui/react";
import { Input } from "@heroui/react";

import React from "react";
import { useRouter } from 'next/navigation';
import { uploadEmoji } from "@/app/lib/emoji_utils";


// Modal to allow any member to submit a new custom emoji.
// Follows the same structure and conventions as upload_photo_modal.tsx.
export default function EmojiSubmitModal() {
  const [nameValue, setNameValue]               = React.useState("");
  const [displayNameValue, setDisplayNameValue] = React.useState("");
  const [keywordsValue, setKeywordsValue]       = React.useState("");
  const [nameError, setNameError]               = React.useState("");
  const [fileChosen, setFileChosen]             = React.useState(false);
  const [fileName, setFileName]                 = React.useState("");
  const [fileType, setFileType]                 = React.useState("");
  const [previewUrl, setPreviewUrl]             = React.useState<string | null>(null);
  const [uploading, setUploading]               = React.useState(false);

  const fileRef = React.useRef<HTMLInputElement>(null);
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const router = useRouter();

  // Validate slug on change — lowercase letters, digits, underscores only
  const handleNameChange = (value: string) => {
    const lower = value.toLowerCase();
    setNameValue(lower);
    if (lower && !/^[a-z0-9_]+$/.test(lower)) {
      setNameError("Only lowercase letters, digits, and underscores allowed.");
    } else if (lower.length > 100) {
      setNameError("Must be 100 characters or fewer.");
    } else {
      setNameError("");
    }
  };

  // Validate file and generate a preview URL
  const checkFileData = () => {
    if (fileRef.current && fileRef.current.files![0]) {
      const file = fileRef.current.files![0];
      // Client-side size guard — backend also enforces this
      if (file.size > 256 * 1024) {
        addToast({
          title: "File too large",
          description: "Emoji images must be 256 KB or smaller.",
          color: "danger",
        });
        fileRef.current.value = "";
        return;
      }
      setFileChosen(true);
      setFileName(file.name);
      setFileType(file.type);
      // Revoke the previous object URL to avoid memory leaks
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setFileChosen(false);
      setFileName("");
      setFileType("");
      setPreviewUrl(null);
    }
  };

  // Send upload request to backend
  const uploadPress = async () => {
    if (!fileRef.current || !fileRef.current.files![0]) return;
    // Build FormData matching the backend's expected fields
    const uploadFormData = new FormData();
    uploadFormData.append("name", nameValue);
    uploadFormData.append("display_name", displayNameValue);
    uploadFormData.append("keywords", keywordsValue);
    uploadFormData.append("attached_image", fileRef.current.files![0]);
    uploadFormData.append("filename", fileName);
    uploadFormData.append("filetype", fileType);
    // Submit
    setUploading(true);
    const responseObj = await uploadEmoji(uploadFormData);
    if (responseObj && responseObj.status === 200) {
      addToast({
        title: `Emoji "${nameValue}" submitted!`,
        description: `${displayNameValue || nameValue} has been added to the emoji list.`,
        color: "success",
      });
    } else {
      const errorMsg = responseObj ? (responseObj.data?.error ?? `Error code: ${responseObj.status}`) : "Request failed";
      addToast({
        title: "Failed to submit emoji",
        description: `${errorMsg}. Please contact server administrators with CRID: ${responseObj ? responseObj.crid : "N/A"}.`,
        color: "danger",
      });
    }
    cancelPress();
  };

  // Clear all state and close the modal
  const cancelPress = () => {
    setNameValue("");
    setDisplayNameValue("");
    setKeywordsValue("");
    setNameError("");
    setFileChosen(false);
    setFileName("");
    setFileType("");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    onClose();
    router.refresh();
  };

  const nameValid = nameValue !== "" && !nameError && nameValue.length <= 100;
  const canSubmit = nameValid && fileChosen && !uploading;

  return (
    <>
      <Button
        className="p-3 -mt-2 mb-2 text-sm min-w-0 min-h-0 h-fit bg-gradient-to-br from-green-700 to-green-800 hover:underline"
        size="sm"
        onPress={onOpen}
        radius="lg"
        variant="solid"
      >
        Submit New Emoji
      </Button>
      <Modal size="xl" isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={false} onClose={cancelPress}>
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col flex-wrap w-full gap-1 content-center">
                Submit a Custom Emoji
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-3">
                  <Input
                    isRequired
                    label="Name"
                    placeholder="e.g. my_emoji  (no spaces, no capitals)"
                    value={nameValue}
                    onValueChange={handleNameChange}
                    isInvalid={!!nameError}
                    errorMessage={nameError}
                    description="Lowercase letters, digits, and underscores ONLY."
                  />
                  <Input
                    label="Display Name"
                    placeholder="Human-readable label shown in the picker (optional)"
                    value={displayNameValue}
                    onValueChange={setDisplayNameValue}
                  />
                  <Input
                    label="Keywords"
                    placeholder="Comma-separated search keywords, e.g. rat, jak, etc."
                    value={keywordsValue}
                    onValueChange={setKeywordsValue}
                  />
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-gray-400">
                      Image file — PNG, GIF, JPG, or WebP, [Maxiumum size 256 KB]
                    </p>
                    <input
                      type="file"
                      accept=".png,.gif,.jpg,.jpeg,.webp"
                      onChange={checkFileData}
                      ref={fileRef}
                      required
                    />
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt="Emoji preview"
                        className="w-16 h-16 object-contain rounded border border-neutral-700 mt-1"
                      />
                    )}
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={cancelPress}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  isLoading={uploading}
                  isDisabled={!canSubmit}
                  onPress={uploadPress}
                >
                  Submit
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
