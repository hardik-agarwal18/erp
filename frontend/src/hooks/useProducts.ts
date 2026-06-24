import { useQuery } from '@tanstack/react-query';
import { DefaultService } from '../lib/generated';

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => DefaultService.getApiV1Products(),
  });
};
