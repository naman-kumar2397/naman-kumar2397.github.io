# Graph Rendering Spec

## Node types
- company
- project
- problem
- solution
- impact

## Relationships
- company owns projects
- project has problem + solution
- problem solved_by solution
- project drives impact (many-to-many; shared impacts allowed)

## Layout
Default direction: left-to-right
- Column 1: Company
- Column 2: Projects (stacked)
- Column 3: Problem + Solution (paired “lane” per project)
- Column 4: Impacts (clustered; shared nodes de-duplicated)

## Edge routing
- Orthogonal routing with rounded corners
- Edge thickness and opacity indicate focus state
- Arrowheads only on key narrative edges (Problem → Solution → Impact)

## Progressive disclosure
- Overview mode: show Company → Project → Impact edges plus “mini pills” for Problem/Solution
- Focus mode (on project click): expand that project to full Problem → Solution details and tool carousel
- Focus mode (on impact click): highlight all linked projects and their solutions

## Interaction rules
- Hover: glow + show tooltip
- Click: focus (dim everything else)
- ESC: reset
- Deep link: `/project/[id]` should focus that project when returning to home

## Accessibility
- Nodes are focusable elements
- Provide aria-labels with type, title, and short summary
- Keyboard operations mirror click interactions

