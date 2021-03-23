import { JoinRoomAndGetInfoResponse } from "@dogehouse/kebab";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { useCurrentRoomIdStore } from "../../global-stores/useCurrentRoomIdStore";
import { isUuid } from "../../lib/isUuid";
import { showErrorToast } from "../../lib/showErrorToast";
import { useTypeSafeQuery } from "../../shared-hooks/useTypeSafeQuery";
import { RoomHeader } from "../../ui/RoomHeader";
import { Spinner } from "../../ui/Spinner";
import { RoomUsersPanel } from "./RoomUsersPanel";
import { UserPreviewModal } from "./UserPreviewModal";

interface RoomPanelControllerProps {}

export const RoomPanelController: React.FC<RoomPanelControllerProps> = ({}) => {
  const { currentRoomId, setCurrentRoomId } = useCurrentRoomIdStore();
  const { query } = useRouter();
  const roomId = typeof query.id === "string" ? query.id : "";
  const { data, isLoading } = useTypeSafeQuery(
    ["joinRoomAndGetInfo", currentRoomId || ""],
    {
      enabled: isUuid(roomId),
      onSuccess: ((d: JoinRoomAndGetInfoResponse | { error: string }) => {
        if (!("error" in d)) {
          setCurrentRoomId(() => d.room.id);
        }
      }) as any,
    },
    [roomId]
  );
  const { push } = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!data) {
      push("/dashboard");
      return;
    }
    if ("error" in data) {
      showErrorToast(data.error);
      push("/dashboard");
    }
  }, [data, isLoading, push]);

  if (isLoading || !currentRoomId) {
    return <Spinner />;
  }

  if (!data || "error" in data) {
    return null;
  }

  const roomCreator = data.users.find((x) => x.id === data.room.creatorId);

  return (
    <div className={`w-full flex-col`}>
      <UserPreviewModal {...data} />
      <RoomHeader
        title={data.room.name}
        description={data.room.description || ""}
        names={roomCreator ? [roomCreator.username] : []}
      />
      <RoomUsersPanel {...data} />
    </div>
  );
};
