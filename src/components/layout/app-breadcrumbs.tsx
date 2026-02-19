import { Fragment } from "react";
import { Link, useMatches } from "@tanstack/react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function AppBreadcrumbs() {
  const matches = useMatches();
  const crumbs = matches.filter((m) => m.staticData?.breadcrumb);

  if (crumbs.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((match, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <Fragment key={match.id}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{match.staticData.breadcrumb}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={match.pathname}>
                      {match.staticData.breadcrumb}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
