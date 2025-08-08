import { useEffect } from 'react';

export const useNavUpdates = (
  baskt: any,
  setBaskt: (baskt: any) => void,
  isBasktNavDataLoaded: boolean,
  basktNavData: any,
) => {
  useEffect(() => {
    if (!isBasktNavDataLoaded) return;
    if (!baskt) return;
    if (!basktNavData?.data?.nav) return;

    const basktCopy = baskt;
    if (!basktCopy) return;
    if (basktNavData?.data?.nav === basktCopy.price) return;

    setBaskt({
      ...basktCopy,
      price: basktNavData?.data?.nav,
    });
  }, [baskt, isBasktNavDataLoaded, basktNavData, setBaskt]);
};
