import EmptyTranscriptionModal from "../../components/overlays/modals/EmptyTranscriptionModal";
import TranscriptionPricingModal from "../../components/overlays/modals/TranscriptionPricingModal";
import { useAuth } from "../../stores/authStore";
import { formatVideoSecond } from "../../lib/helper-pure";
import { isUserFreePlan } from "../../lib/payment-helper";
import { transcriptionLanguage } from "../../lib/types";
import webAPI from "../../lib/webapi";
import { Loader, Modal, Select, Tabs } from "@mantine/core";
import { RecordingModel } from "@schema/index";
import { throttle } from "../../lib/utils";
import { useEffect, useReducer, useState } from "react";
import { TbRobot } from "react-icons/tb";
import type Player from "video.js/dist/types/player";

import styles from "../../styles/modules/TranscriptionTab.module.scss";

type TranscriptionStates = {
  transcriptionLanguage: string;
  showConfirmation: boolean;
  emptyTranscriptionOpened: boolean;
  transcriptionPricingModalOpened: boolean;
};

type TranscriptionTabPanelProps = {
  player?: Player;
  recording: RecordingModel;
  setRecording: (recording: RecordingModel) => void;
  paragraphs?: any[];
  words?: any[];
  allowTranscriptionGeneration: boolean;
};

export default function TranscriptionTabPanel({
  player,
  recording,
  setRecording,
  paragraphs,
  words,
  allowTranscriptionGeneration,
}: TranscriptionTabPanelProps) {
  const [transcriptionStates, setTranscriptionStates] = useReducer(
    (prev: TranscriptionStates, cur: Partial<TranscriptionStates>) => {
      return { ...prev, ...cur };
    },
    {
      transcriptionLanguage: localStorage.getItem("transcriptLanguage") || "en",
      showConfirmation: false,
      emptyTranscriptionOpened: false,
      transcriptionPricingModalOpened: false,
    }
  );
  let [searchValue, setSearchValue] = useState("");
  const { ventoUser } = useAuth();
  const [transcriptionFreeModalSource, setTranscriptionFreeModalSource] = useState("");

  function createParagraphFromWords(
    paragraphStartTime: number,
    paragraphEndTime: number
  ) {
    const firstWordIndex =
      words?.findIndex((word) => word.start >= paragraphStartTime) ?? -1;
    const endWordIndex =
      words?.findIndex((word) => word.end >= paragraphEndTime) ?? -1;

    if (firstWordIndex === -1) return;

    // Sometimes if the paragraph is the last paragraph, the paragraph start time is the same as the end time
    if (paragraphStartTime === paragraphEndTime)
      return words
        ?.slice(firstWordIndex)
        .map((word) => word.punctuated_word)
        .join(" ");

    return words
      ?.slice(
        firstWordIndex,
        endWordIndex === -1 ? undefined : endWordIndex + 1
      )
      .map((word) => word.punctuated_word)
      .join(" ");
  }

  function onUpgradingPlanConfirm() {
    window.location.href = "/pricing";
  }

  const onGenerateTranscriptionClick = async () => {
    if (!recording) return;
    if (isUserFreePlan(ventoUser)) {
      const isTranscriptionDeleted = await webAPI.analytic.analyticIsTranscriptionDeleted(recording.id);
      if (isTranscriptionDeleted) {
        setTranscriptionStates({ transcriptionPricingModalOpened: true });
        setTranscriptionFreeModalSource("generateTranscriptionClicked");
        return;
      }
    }
    setTranscriptionStates({ showConfirmation: true });
  };

  async function generateTranscription() {
    if (!recording) return;

    const loaderEl = document.querySelector(
      `.vento-modal .loader`
    ) as HTMLElement;

    if (loaderEl) loaderEl.style.display = "inline-block";

    const response = await webAPI.transcribe.transcribeTranscribeRecording(
      recording.id,
      transcriptionStates.transcriptionLanguage
    );

    setRecording({
      ...recording,
      transcription: response,
    });

    if (response.results?.words?.length === 0) {
      setTranscriptionStates({ emptyTranscriptionOpened: true });
    }

    if (loaderEl) loaderEl.style.display = "none";
    setTranscriptionStates({ showConfirmation: false });
  }

  useEffect(() => {
    if (!player || !paragraphs) return;

    player.ready(() => {
      let savedElementOffset = 0;
      let lastScrolledParagraphIndex = 0;

      player.on(
        "timeupdate",
        throttle(() => {
          if ((paragraphs.length ?? 0) === 0) return;

          const currentTime = player.currentTime();
          if (currentTime === undefined) return;

          const inversedLatestParagraphIndex = paragraphs
            .slice()
            .reverse()
            .findIndex((paragraph: any) => {
              if (paragraph.start <= currentTime) {
                return true;
              }
            });

          const latestParagraphIndex =
            inversedLatestParagraphIndex === -1
              ? -1
              : paragraphs.length - inversedLatestParagraphIndex - 1;

          if (
            latestParagraphIndex !== -1 &&
            lastScrolledParagraphIndex !== latestParagraphIndex
          ) {
            lastScrolledParagraphIndex = latestParagraphIndex;

            const currentParagraphLi = document.querySelector(
              `li[data-index='${latestParagraphIndex}']`
            ) as HTMLLIElement;

            if (currentParagraphLi) {
              const container = currentParagraphLi.parentElement!;
              const containerOffset = container.getBoundingClientRect().top;
              const elementOffset =
                currentParagraphLi.getBoundingClientRect().top;

              if (elementOffset !== savedElementOffset) {
                savedElementOffset = elementOffset;
                const relativeY = elementOffset - containerOffset;
                container.scrollTop =
                  container.scrollTop - container.offsetHeight / 2.5 + relativeY;
              }
            }
          }

          paragraphs.forEach((paragraph: any, i: number) => {
            const currentParagraphLi = document.querySelector(
              `li[data-index='${i}']`
            ) as HTMLLIElement;

            if (currentParagraphLi) {
              if (paragraph.start <= currentTime) {
                currentParagraphLi.classList.remove(styles.inactive);
              } else {
                currentParagraphLi.classList.add(styles.inactive);
              }
            }
          });
        }, 500)
      );
    });
  }, [paragraphs, player]);

  return (
    <>
      <Tabs.Panel
        className={styles.transcriptionPanel}
        value="transcription"
        pt="xs"
      >
        {!!paragraphs ? (
          <>
            <ul className={styles.transcriptionList}>
              {paragraphs?.map((paragraph: any, i: number) => (
                <li className={styles.inactive} key={i} data-index={i}>
                  <button
                    onClick={() => {
                      const paused = player?.paused();
                      player?.play();
                      player?.currentTime(paragraph.start);
                      if (paused) player?.pause();
                    }}
                  >
                    <span className={styles.timestamp}>
                      {formatVideoSecond(paragraph.start)}
                    </span>
                    <span className={styles.content}>
                      {createParagraphFromWords(
                        paragraph.sentences[0].start,
                        paragraph.sentences[paragraph.sentences.length - 1].end
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : allowTranscriptionGeneration ? (
          <>
            <Select
              placeholder="Language"
              data={transcriptionLanguage}
              label="Transcription Language"
              defaultValue={transcriptionStates.transcriptionLanguage}
              searchable
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              clearable
              onChange={(e) => {
                if (e) {
                  setTranscriptionStates({ transcriptionLanguage: e });
                  localStorage.setItem("transcriptLanguage", e);
                }
              }}
              style={{ marginTop: "5px" }}
            />
            <button
              onClick={onGenerateTranscriptionClick}
              className={styles.generateTranscriptionBtn}
              disabled={!transcriptionStates.transcriptionLanguage}
            >
              <TbRobot size={20} />
              Generate Transcription
            </button>
          </>
        ) : (
          <span>No transcription available for this recording</span>
        )}
      </Tabs.Panel>

      <Modal
        opened={transcriptionStates.showConfirmation}
        onClose={() => setTranscriptionStates({ showConfirmation: false })}
        title={`Your transcription selection is ${
          transcriptionLanguage.find(
            (lang) => lang.value === transcriptionStates.transcriptionLanguage
          )?.label
        }`}
        centered
        size="auto"
        classNames={{
          root: "vento-modal",
        }}
      >
        <p>
          Make sure your Vento was recorded in&nbsp;
          <strong>
            {
              transcriptionLanguage.find(
                (lang) => lang.value === transcriptionStates.transcriptionLanguage
              )?.label
            }
          </strong>
          &nbsp;before selecting &quot;Generate&quot; or your transcription may
          be inaccurate
        </p>

        <div className="cta-container">
          <button onClick={generateTranscription} className="confirm-btn">
            Generate
            <Loader
              color="dark"
              size="xs"
              className="loader"
              style={{ display: "none" }}
            />
          </button>
          <button
            onClick={() => setTranscriptionStates({ showConfirmation: false })}
            className="cancel-btn"
          >
            Pick Another Language
          </button>
        </div>
      </Modal>

      <EmptyTranscriptionModal
        open={transcriptionStates.emptyTranscriptionOpened}
        onClose={() =>
          setTranscriptionStates({ emptyTranscriptionOpened: false })
        }
      />

      <TranscriptionPricingModal
        opened={transcriptionStates.transcriptionPricingModalOpened}
        modalSource={transcriptionFreeModalSource}
        onConfirm={() => onUpgradingPlanConfirm()}
        onClose={() => {
          setTranscriptionStates({ transcriptionPricingModalOpened: false });
        }}
      />
    </>
  );
}
