import { useEffect, useMemo, useRef, useState } from "react";
import {
  Eip6963AnnounceProviderEvent,
  Eip6963ProviderDetail,
} from "./Eip6963Types";

export interface Eip6963State {
  uuids: Record<string, Eip6963ProviderDetail> | undefined;
  error: Error | undefined;
  providers: Eip6963ProviderDetail[];
}

export function useEip6963(): Eip6963State {
  const [error, setError] = useState<Error | undefined>(undefined);
  const [uuids, setUuids] = useState<
    Record<string, Eip6963ProviderDetail> | undefined
  >(undefined);
  const activeLoadId = useRef(0);
  const isListener = useRef<boolean>(false);
  const providers = useMemo<Eip6963ProviderDetail[]>(() => uuids ? Object.values(uuids) : [], [uuids]);

  function _addUuidInternal(providerDetail: Eip6963ProviderDetail) {
    setUuids((prev) => {
      if (!prev) {
        return { [providerDetail.info.uuid]: providerDetail };
      }
      const existing = prev[providerDetail.info.uuid];
      if (
        !!existing &&
        existing.info.uuid === providerDetail.info.uuid &&
        existing.info.name === providerDetail.info.name &&
        existing.info.rdns === providerDetail.info.rdns &&
        existing.info.icon === providerDetail.info.icon &&
        existing.provider === providerDetail.provider
      ) {
        return prev;
      }
      return { ...prev, [providerDetail.info.uuid]: providerDetail };
    });
  }

  useEffect(() => {
    const thisLoadId = ++activeLoadId.current;

    const onEip6963AnnounceProvider = (event: Event) => {
      if ("detail" in event) {
        const providerDetail = (event as Eip6963AnnounceProviderEvent).detail;
        _addUuidInternal(providerDetail);
      }
    };

    const run = async () => {
      if (thisLoadId !== activeLoadId.current) {
        return;
      }

      if (isListener.current) {
        return;
      }

      if (typeof window === "undefined") {
        return;
      }

      setError(undefined);

      try {
        window.addEventListener(
          "eip6963:announceProvider",
          onEip6963AnnounceProvider
        );
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
        return;
      }

      isListener.current = true;

      try {
        window.dispatchEvent(new Event("eip6963:requestProvider"));
      } catch (e) {
        window.removeEventListener(
          "eip6963:announceProvider",
          onEip6963AnnounceProvider
        );
        setError(e instanceof Error ? e : new Error(String(e)));
        isListener.current = false;
      }
    };

    run();

    return () => {
      activeLoadId.current = activeLoadId.current + 1;
      window.removeEventListener(
        "eip6963:announceProvider",
        onEip6963AnnounceProvider
      );
    };
  }, []);

  return { error, uuids, providers };
}




