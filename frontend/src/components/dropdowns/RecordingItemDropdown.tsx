import React, { useState } from "react";
import { Menu } from "@mantine/core";
import { BiDotsHorizontalRounded } from "react-icons/bi";
import { RiDeleteBinLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { showNotification } from "@mantine/notifications";

type RecordingModalItem = any;
type FolderViewModel = any;

type RecordingItemDropdownProps = {
  recording: RecordingModalItem;
  children?: React.ReactNode;
  allowEdit?: boolean;
  folders: FolderViewModel[];
  onDeleteConfirm: () => void | Promise<void>;
  onArchiveConfirm?: () => Promise<void>;
  onMoveConfirm: (folderId: string) => void;
  onUpdatePassword: (password?: string) => void;
  onUpdateTitle: (title: string) => Promise<void>;
  onTurnOffAutoArchiveConfirm: () => Promise<void>;
  position?: "bottom" | "right" | "left" | "top";
};

/**
 * Minimal dropdown for view recording page (desktop).
 * Supports delete and move to folder; other actions can be added later.
 */
export default function RecordingItemDropdown({
  recording,
  allowEdit,
  folders,
  onDeleteConfirm,
  onMoveConfirm,
  position = "bottom",
  children,
}: RecordingItemDropdownProps) {
  const [opened, setOpened] = useState(false);
  const navigate = useNavigate();

  const handleDelete = async () => {
    setOpened(false);
    await Promise.resolve(onDeleteConfirm());
    navigate("/recordings");
  };

  return (
    <Menu
      position={position}
      shadow="md"
      opened={opened}
      onClose={() => setOpened(false)}
    >
      <Menu.Target>
        {children ?? (
          <button type="button" className="more-btn">
            More <BiDotsHorizontalRounded />
          </button>
        )}
      </Menu.Target>
      <Menu.Dropdown>
        {allowEdit && folders.length > 0 && (
          <>
            <Menu.Label>Move to folder</Menu.Label>
            {folders.map((folder: any) => (
              <Menu.Item
                key={folder.id}
                onClick={() => {
                  setOpened(false);
                  onMoveConfirm(folder.id);
                }}
              >
                {folder.name}
              </Menu.Item>
            ))}
            <Menu.Divider />
          </>
        )}
        <Menu.Item
          color="red"
          leftSection={<RiDeleteBinLine size={16} />}
          onClick={handleDelete}
        >
          Delete
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
