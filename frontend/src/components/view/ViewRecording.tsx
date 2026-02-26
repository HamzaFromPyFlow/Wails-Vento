import { useEffect, useMemo, useState, useReducer, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader, Tabs, Tooltip } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { BiLink, BiDotsHorizontalRounded } from "react-icons/bi";
import { CgTranscript } from "react-icons/cg";
import { GrFormView } from "react-icons/gr";
import { HiOutlineFolder } from "react-icons/hi";
import { AiFillLock } from "react-icons/ai";
import { RiListCheck2 } from "react-icons/ri";
import { MdOutlineDone, MdOutlineCancel } from "react-icons/md";
import type Player from "video.js/dist/types/player";
import Header from "../Header/Header";
import VideoPlayer from "../../components/media/VideoPlayer";
import RecordingItemDropdown from "../dropdowns/RecordingItemDropdown";
import Summary from "./Summary";
import TranscriptionTabPanel from "./TranscriptionTabPanel";
import { isUserFreePlan } from "../../lib/payment-helper";
import { logClientEvent, onCopyLink, convertToRecordingModalItem } from "../../lib/misc";
import { formatVideoDuration } from "../../lib/helper-pure";
import { useAuth } from "../../stores/authStore";
import type { RecordingModel, ChapterHeading, AuthorAnnotation, FolderViewModel } from "@schema/index";
import type { CtaLink } from "../../lib/types";
import { getRecording } from "../../lib/server/data";
import webAPI from "../../lib/webapi";
import styles from "../../styles/modules/ViewRecording.module.scss";

type VideoInfoStates = {
  editTitle: boolean;
  title: string;
  videoViews: number;
};

type AnnotationDetail = AuthorAnnotation & {
  viewed?: boolean;
};

type CtaLinkDetail = CtaLink & {
  skipped?: boolean;
};

// Simple throttle function
function throttle<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null;
  let previous = 0;
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = wait - (now - previous);
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func(...args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func(...args);
      }, remaining);
    }
  }) as T;
}

export default function ViewRecording() {
  const { id: recordingIdParam } = useParams();
  const recordingId = recordingIdParam ?? undefined;
  const navigate = useNavigate();
  const { ventoUser, loadingUser } = useAuth();
  const playerRef = useRef<Player>();

  const [recording, setRecording] = useState<RecordingModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [folders, setFolders] = useState<FolderViewModel[]>([]);

  const [videoStates, setVideoStates] = useReducer(
    (state: VideoInfoStates, newState: Partial<VideoInfoStates>) => {
      return { ...state, ...newState };
    },
    {
      editTitle: false,
      title: "",
      videoViews: 0,
    }
  );

  // Load recording data
  useEffect(() => {
    if (!recordingId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    getRecording(recordingId)
      .then((res) => {
        if (cancelled) return;
        if (!res) {
          setError("Recording not found.");
        } else {
          // Sort headings by timestamp
          if (res.metadata?.headings) {
            res.metadata.headings.sort((a: ChapterHeading, b: ChapterHeading) => a.timestamp - b.timestamp);
          }
          setRecording(res);
          setVideoStates({ title: res.title || "" });
          logClientEvent("page.view.viewRecording");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Failed to load recording.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [recordingId]);

  // Load folders
  useEffect(() => {
    if (loadingUser === "loading" || !ventoUser) return;

    webAPI.folder
      .folderGetUserFolders()
      .then((data) => {
        if (recording) {
          const filteredFolders = data.filter(
            (folder) => folder.isArchived === recording.isArchived
          );
          setFolders(filteredFolders);
        }
      })
      .catch(() => {
        // Ignore errors
      });
  }, [loadingUser, ventoUser, recording]);

  const isRecordingOwner = ventoUser && recording?.userId === ventoUser?.id;
  const isVideoProcessed =
    recording?.encodingStatus === "DONE" &&
    recording?.videoUrl &&
    !recording?.isArchived;

  const videoChapterHeadings: ChapterHeading[] = useMemo(() => {
    return recording?.metadata?.["headings"] ?? [];
  }, [recording?.metadata]);

  const videoAuthorAnnotation = useRef<AnnotationDetail[]>(
    recording?.metadata?.["annotations"]
      ? JSON.parse(JSON.stringify(recording?.metadata?.["annotations"]))
      : []
  );

  const videoCtas = useRef<CtaLinkDetail[]>(
    recording?.metadata?.["ctas"]
      ? JSON.parse(JSON.stringify(recording?.metadata?.["ctas"]))
      : []
  );

  const paragraphs = useMemo(
    () => recording?.transcription?.results?.paragraphs?.paragraphs,
    [recording?.transcription?.results?.paragraphs?.paragraphs]
  );

  const allowTranscriptionGeneration =
    ventoUser?.id === recording?.userId && !recording?.transcription?.results;

  const showParagraphs = !!paragraphs;
  const showNoTranscriptionMessage = !!!paragraphs && ventoUser?.id === recording?.userId;
  const showTranscriptionTab =
    recording?.audioUrl &&
    (showParagraphs || allowTranscriptionGeneration || showNoTranscriptionMessage);
  const showTabPanel = showTranscriptionTab || videoChapterHeadings.length > 0;

  async function onUpdateTitle() {
    if (!recording) return;
    setVideoStates({ editTitle: false });

    if (videoStates.title.length > 0) {
      setRecording({ ...recording, title: videoStates.title });
      await webAPI.recording.recordingUpdateTitle(recording.id, videoStates.title);
    }
  }

  const onVideoPlayerReady = useCallback(
    async (player: Player) => {
      playerRef.current = player;
      
      if (!recording) return;

      try {
        const data = await webAPI.analytic.analyticGetVideoViews(recording.id);
        const currVideoViews = data?.viewCount ?? 0;
        setVideoStates({ videoViews: currVideoViews });
      } catch (error) {
        console.error("Error fetching video views:", error);
      }

      // Wait for the video to play for the first time
      const anyPlayer = player as any;

      anyPlayer.one?.("playing", async () => {
        const seekBar = anyPlayer
          .getChild("ControlBar")
          ?.getChild("ProgressControl")
          ?.getChild("SeekBar")
          ?.el();

        // Add annotation buttons to seekbar
        videoAuthorAnnotation.current.forEach((annotation) => {
          const annotationBtn = document
            .getElementById("annotationBtnTemplate")
            ?.cloneNode(true) as HTMLButtonElement;

          if (!annotationBtn || !seekBar) return;

          const playerDuration = anyPlayer.duration?.();
          if (playerDuration === undefined) return;
          const durationPercentage = annotation.timestamp / (playerDuration * 1000);

          annotationBtn.style.cssText = `display: block; position: absolute; bottom: 105%; left: ${
            durationPercentage * 100
          }%; transform: translateX(-50%);`;

          annotationBtn.addEventListener("click", (e) => {
            e.stopImmediatePropagation();
            e.preventDefault();
            annotation.viewed = false;
            setTimeout(() => {
              anyPlayer.currentTime?.(annotation.timestamp / 1000);
            }, 50);
          });
          seekBar.appendChild(annotationBtn);
        });

        // Add CTA buttons to seekbar
        videoCtas.current.forEach((cta) => {
          if (!cta.isActive) return;

          const ctaBtn = document
            .getElementById("linkCtaTemplate")
            ?.cloneNode(true) as HTMLButtonElement;

          if (!ctaBtn || !seekBar) return;

          const playerDuration = anyPlayer.duration?.();
          if (playerDuration === undefined) return;
          const durationPercentage = cta.time / (playerDuration * 1000);

          ctaBtn.style.cssText = `display: block; position: absolute; bottom: 105%; left: ${
            durationPercentage * 100
          }%; transform: translateX(-50%);`;

          ctaBtn.addEventListener("click", (e) => {
            e.stopImmediatePropagation();
            e.preventDefault();
            cta.skipped = false;
            setTimeout(() => {
              anyPlayer.currentTime?.(cta.time / 1000);
            }, 50);
          });
          seekBar.appendChild(ctaBtn);
        });
      });

      // Handle annotation popups during playback
      anyPlayer.on?.(
        "timeupdate",
        throttle(() => {
          const playerCurrentTime = anyPlayer.currentTime?.();
          if (playerCurrentTime === undefined) return;
          const currentTime = Math.round(playerCurrentTime);

          videoAuthorAnnotation.current.forEach((annotation) => {
            if (
              Math.round(annotation.timestamp / 1000) === currentTime &&
              !annotation.viewed
            ) {
              const annotationPopup = document.querySelector(".annotation-popup");
              if (annotationPopup) {
                const annotationPopupText = annotationPopup.querySelector(
                  ".annotation-chatbubble-text"
                );
                const gotItBtn = annotationPopup.querySelector(
                  ".annotation-popup-content button"
                );

                if (annotationPopupText) {
                  annotationPopupText.textContent = annotation.text;
                }

                gotItBtn?.addEventListener("click", () => {
                  annotationPopup.classList.remove("visible");
                  anyPlayer.play?.();
                  annotation.viewed = true;
                });

                annotationPopup.classList.add("visible");
                anyPlayer.pause?.();
                return;
              }
            }
          });

          // Handle CTA overlays
          videoCtas.current.forEach((cta) => {
            if (!cta.isActive) return;
            if (Math.round(cta.time / 1000) === currentTime && !cta.skipped) {
              const ctaOverlay = document.querySelector(".overlay");
              if (ctaOverlay) {
                const overlayContent = ctaOverlay.querySelector(".overlayContent");
                const overlayLink = overlayContent?.querySelector(
                  ".overlayContent a"
                ) as HTMLAnchorElement;
                const overlayLinkText = overlayContent?.querySelector(".link-text");

                if (overlayContent && overlayLink && overlayLinkText) {
                  overlayLinkText.textContent = cta.linkCtaText;
                  overlayLink.href = cta.linkCtaUrl.startsWith("http")
                    ? cta.linkCtaUrl
                    : `https://${cta.linkCtaUrl}`;

                  ctaOverlay.classList.add("visible");
                  anyPlayer.pause?.();
                }

                const skipBtn = ctaOverlay.querySelector(".overlayContentSkip");
                const rewatchBtn = ctaOverlay.querySelector(".overlayContentRewatch");
                const playerDuration = anyPlayer.duration?.();
                const isCtaAtEnd = playerDuration !== undefined && Math.abs(cta.time / 1000 - playerDuration) <= 0.1;

                if (!isCtaAtEnd && skipBtn && rewatchBtn) {
                  skipBtn.classList.add("visible");
                  rewatchBtn.classList.remove("visible");
                  skipBtn.addEventListener("click", () => {
                    ctaOverlay.classList.remove("visible");
                    cta.skipped = true;
                    anyPlayer.play?.();
                  });
                }
                if (isCtaAtEnd && rewatchBtn && skipBtn) {
                  skipBtn.classList.remove("visible");
                  rewatchBtn.classList.add("visible");
                  rewatchBtn.addEventListener("click", () => {
                    ctaOverlay.classList.remove("visible");
                    anyPlayer.currentTime?.(0);
                    anyPlayer.play?.();
                  });
                }
              }
            }
          });
        }, 500)
      );
    },
    [recording]
  );

  // Update last viewed timestamp
  useEffect(() => {
    if (!recording?.userId || loadingUser === "loading") return;

    webAPI.recording.recordingUpdateRecording(recording.id, {
      last_viewedAt: new Date().toISOString(),
    });
  }, [loadingUser, ventoUser, recording?.id, recording?.userId]);

  const videoJsOptions = useMemo(() => {
    if (!recording) return undefined;

    return {
      allowEndVideoModal:
        (!!!ventoUser?.id || isUserFreePlan(ventoUser)) &&
        isUserFreePlan(recording.user ?? undefined),
      sources: [
        {
          src: recording.videoUrl,
        },
      ],
      trackSource: recording.transcription?.webVTTUrl,
      textTrackSettings: false,
      createdAt: recording.createdAt,
    };
  }, [recording, ventoUser]);

  const handleCopyLink = () => {
    if (!recording) return;
    const currentUrl = `${window.location.origin}${window.location.pathname}#/view/${recording.id}`;
    webAPI.recording.recordingUpdateRecording(recording.id, {
      updatedAt: new Date().toISOString(),
    });
    onCopyLink(currentUrl);
  };

  if (loadingUser === "loading") {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <div className={styles.encodingText}>
            <Loader />
          </div>
        </main>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <div className={styles.encodingText}>
            <Loader />
          </div>
        </main>
      </>
    );
  }

  if (error || !recording) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <div className={styles.encodingText}>
            <p>{error || "Recording not found"}</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main
        className={`${styles.main} ${showTabPanel ? styles.withHeading : ""}`}
      >
        <div className={styles.leftColumn}>
          <div className={styles.videoHeaderPrompt}>
            <div className={styles.btnContainers}>
              <button onClick={handleCopyLink} className={styles.copyLinkBtn}>
                Copy Link <BiLink />
              </button>
              {isRecordingOwner && (
                <RecordingItemDropdown
                  recording={convertToRecordingModalItem(recording, ventoUser)}
                  folders={folders.filter(
                    (folder) => folder.id !== recording.folders?.[0]?.id
                  )}
                  position="bottom"
                  allowEdit={convertToRecordingModalItem(recording, ventoUser).isEditable}
                  onDeleteConfirm={async () => {
                    await webAPI.recording.recordingDeleteRecording(recording.id);
                    navigate("/recordings");
                  }}
                  onMoveConfirm={async (folderId) => {
                    if (!folderId) return;
                    let updated = null;
                    if (folderId === "-1") {
                      updated = await webAPI.recording.recordingRemoveFromFolder(recording.id);
                    } else {
                      updated = await webAPI.recording.recordingAddToFolder(recording.id, folderId);
                    }
                    if (updated) {
                      setRecording({ ...recording, folders: updated.folders });
                      showNotification({
                        message: "Successfully moved video to folder!",
                        color: "green",
                      });
                    }
                  }}
                  onUpdatePassword={async (password) => {
                    let updatedRecording: RecordingModel;
                    if (password) {
                      updatedRecording = await webAPI.recording.recordingSetPassword(recording.id, {
                        password: password,
                      });
                    } else {
                      updatedRecording = await webAPI.recording.recordingUpdateRecording(
                        recording.id,
                        {
                          metadata: {
                            ...recording.metadata,
                            password: undefined,
                          },
                        }
                      );
                    }
                    if (updatedRecording) {
                      setRecording(updatedRecording);
                    }
                  }}
                  onUpdateTitle={async (title) => {
                    if (!title) return;
                    await webAPI.recording.recordingUpdateTitle(recording.id, title as string);
                    setRecording({ ...recording, title });
                  }}
                  onTurnOffAutoArchiveConfirm={async () => {
                    try {
                      if (!recording.autoArchiveDisabled) {
                        await webAPI.recording.recordingPatchRecording(recording.id, {
                          autoArchiveDisabled: true,
                        });
                      }
                      setRecording({ ...recording, autoArchiveDisabled: true });
                      showNotification({
                        message: "Auto archived turned off for video!",
                        icon: MdOutlineDone({ color: "white" }),
                        autoClose: 3000,
                        color: "green",
                      });
                    } catch (err: any) {
                      showNotification({
                        message: `Oops!! looks like something went wrong ${err.message}`,
                        icon: MdOutlineCancel({ color: "white" }),
                        autoClose: 3000,
                        color: "red",
                      });
                    }
                  }}
                >
                  <button className={styles.moreBtn}>
                    More <BiDotsHorizontalRounded />
                  </button>
                </RecordingItemDropdown>
              )}
            </div>
          </div>

          {isVideoProcessed ? (
            <div className={styles.videoWrapper}>
              <VideoPlayer
                options={videoJsOptions}
                className={`${styles.video} ${!isVideoProcessed ? "hidden" : ""}`}
                onReady={onVideoPlayerReady}
              >
                <>
                  <div className="overlay">
                    <div className="overlayContent">
                      <a href="vento.so" target="_blank">
                        <span className="link-text"></span> &rarr;
                      </a>
                    </div>
                    <button className="overlayContentSkip">Skip</button>
                    <button className="overlayContentRewatch">Rewatch</button>
                  </div>
                  <div className="annotation-popup-content">
                    <div className="annotation-chatbubble">
                      <span className="annotation-chatbubble-text"></span>
                      <button>Got it</button>
                    </div>
                  </div>
                </>
              </VideoPlayer>
            </div>
          ) : (
            <div className={styles.encodingText}>
              <h2>Video being processed...</h2>
              <p>Page will automatically refresh when the video is finished processing</p>
            </div>
          )}

          <section className={styles.metaContainer}>
            <div className={styles.infoContainer}>
              {recording.metadata?.password && (
                <Tooltip label="This video is password protected!">
                  <button className={styles.lockBtn}>
                    <AiFillLock size={25} />
                  </button>
                </Tooltip>
              )}

              <div className={styles.leftColumn}>
                {isRecordingOwner && recording.folders?.[0] && (
                  <a href={`#/recordings/folder/${recording.folders[0].id}`}>
                    <HiOutlineFolder size={14} /> {recording.folders[0].name}
                  </a>
                )}
                {!videoStates.editTitle ? (
                  <h1
                    onClick={() => {
                      if (recording.userId !== ventoUser?.id) return;
                      setVideoStates({
                        editTitle: true,
                        title: recording.title || "",
                      });
                    }}
                    className={`${styles.title} ${
                      recording.userId !== ventoUser?.id ? styles.disableEdit : ""
                    }`}
                  >
                    {recording.title}
                  </h1>
                ) : (
                  <input
                    className={styles.titleInput}
                    value={videoStates.title}
                    placeholder="Enter your vento title..."
                    onChange={(e) => setVideoStates({ title: e.currentTarget.value })}
                    autoFocus
                    onBlur={onUpdateTitle}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onUpdateTitle();
                    }}
                  />
                )}

                {recording.user && (
                  <p>By {recording.user?.displayName || recording.user?.name}</p>
                )}
              </div>

              {isRecordingOwner && videoStates.videoViews > 0 && (
                <span className={styles.viewCount}>
                  <GrFormView size={22.5} />
                  {videoStates.videoViews} view{videoStates.videoViews > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <Summary recording={recording} isEditable={!!isRecordingOwner} />
          </section>
        </div>

        {showTabPanel && (
          <Tabs
            className={styles.headingPanel}
            color="teal"
            defaultValue={
              videoChapterHeadings.length > 0 ? "headings" : "transcription"
            }
          >
            <Tabs.List>
              {videoChapterHeadings.length > 0 && (
                <Tabs.Tab
                  value="headings"
                  leftSection={<RiListCheck2 size={17} />}
                >
                  Chapters
                </Tabs.Tab>
              )}
              {showTranscriptionTab && (
                <Tabs.Tab
                  value="transcription"
                  leftSection={<CgTranscript size={17} />}
                >
                  Transcription
                </Tabs.Tab>
              )}
            </Tabs.List>

            <Tabs.Panel value="headings" pt="xs">
              <ul className={styles.headingList}>
                {videoChapterHeadings.map((heading, i) => (
                  <li key={i}>
                    <button
                      onClick={() => {
                        const vjs = playerRef.current as any;
                        const wasPaused = vjs?.paused?.();
                        vjs?.play?.();
                        vjs?.currentTime?.(heading.timestamp / 1000);
                        if (wasPaused) vjs?.pause?.();
                      }}
                    >
                      <span className={styles.timestamp}>
                        {formatVideoDuration(heading.timestamp)}
                      </span>
                      <span>{heading.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Tabs.Panel>

            <TranscriptionTabPanel
              player={playerRef.current}
              recording={recording}
              allowTranscriptionGeneration={allowTranscriptionGeneration}
              words={recording.transcription?.results?.words}
              paragraphs={paragraphs}
              setRecording={setRecording}
            />
          </Tabs>
        )}
      </main>
    </>
  );
}
