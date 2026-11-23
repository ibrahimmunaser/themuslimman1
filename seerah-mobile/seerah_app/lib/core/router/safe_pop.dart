import 'package:flutter/widgets.dart';
import 'package:go_router/go_router.dart';

/// Back navigation that cannot throw.
///
/// `context.pop()` raises `GoError: There is nothing to pop` when the screen
/// is the only entry in the stack — which happens after a deep link, a
/// notification launch, or a `go()` that replaced the stack (Sentry
/// SEERAH-MOBILE-G). In that case we land on [fallback] instead.
void safePop(BuildContext context, {String fallback = '/dashboard'}) {
  if (context.canPop()) {
    context.pop();
  } else {
    context.go(fallback);
  }
}
