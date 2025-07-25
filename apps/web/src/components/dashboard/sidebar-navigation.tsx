'use client'

import {
  HomeIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import CONFIG from '../../../config'
import type React from 'react'

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  current: boolean;
  external?: boolean;
}

export const navigation: NavItem[] = [
  { name: 'Home', href: '#', icon: HomeIcon, current: true, external: false },
  // { name: 'Docs', href: CONFIG.docsURL, icon: DocumentTextIcon, current: false, external: true },
  // { name: 'Team', href: '#', icon: UsersIcon, current: false },
  // { name: 'Projects', href: '#', icon: FolderIcon, current: false },
  // { name: 'Calendar', href: '#', icon: CalendarIcon, current: false },
  // { name: 'Documents', href: '#', icon: DocumentDuplicateIcon, current: false },
  // { name: 'Reports', href: '#', icon: ChartPieIcon, current: false },
]

export const teams = [
  { id: 1, name: 'Heroicons', href: '#', initial: 'H', current: false },
  { id: 2, name: 'Tailwind Labs', href: '#', initial: 'T', current: false },
  { id: 3, name: 'Workcation', href: '#', initial: 'W', current: false },
]

export function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}
