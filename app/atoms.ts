import {atom} from 'jotai';

export interface Project
{
    id: number;
    name: string;
    description: string;
}

export const projectsAtom = atom<Project[]>([]);
export const isModalOpenAtom = atom(false);

export const projectNameAtom = atom('');
export const projectDescAtom = atom('');

export const currTimeAtom = atom(0);
export const playingAtom = atom(false);

export const playSpeedAtom = atom(1);