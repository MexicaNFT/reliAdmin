import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import config from '../../amplify_outputs.json';
import { generateServerClientUsingReqRes } from '@aws-amplify/adapter-nextjs/api';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const { runWithAmplifyServerContext } = createServerRunner({
  config
});

export const reqResBasedClient = generateServerClientUsingReqRes({
  config
});